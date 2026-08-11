import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import GymSubscription from "../models/GymSubscription.js";
import WalkInVisit from "../models/WalkInVisit.js";
import { calculateFinalPrice } from "../services/pricing.service.js";
import { hashPassword } from "../services/auth.service.js";
import { notify } from "../services/notification.service.js";

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function resolveGymPackage(packageId) {
  const pkg = await Package.findOne({ _id: packageId, isActive: true });
  if (!pkg || pkg.type !== "gym") {
    const err = new Error("Invalid or inactive gym package");
    err.statusCode = 400;
    throw err;
  }
  return pkg;
}

function buildDates(pkg) {
  const startDate = new Date();
  const endDate = addMonths(startDate, pkg.durationMonths);
  return { startDate, endDate };
}

export const createSubscription = asyncHandler(async (req, res) => {
  const { packageId } = req.body;
  const pkg = await resolveGymPackage(packageId);

  const { startDate, endDate } = buildDates(pkg);
  const finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);

  const sub = await GymSubscription.create({
    traineeId: req.user.id,
    packageId: pkg._id,
    handledBy: null,
    startDate,
    endDate,
    finalAmount,
    // Trainee self-service: payment is captured async via Paymob webhook
    paymentStatus: "pending",
    status: "active",
    history: [{ action: "created", date: new Date() }],
  });

  await notify({
    recipientId: req.user.id,
    type: "subscription_created",
    title: "Gym subscription created",
    body: `Your gym subscription is active until ${endDate.toDateString()}.`,
    data: { subscriptionId: sub._id },
  });

  res.status(201).json({ success: true, data: sub });
});

export const registerWalkInTrainee = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, email, password, packageId, mode } =
    req.body;

  if (!firstName || !lastName) {
    const err = new Error("firstName and lastName are required");
    err.statusCode = 400;
    throw err;
  }

  const walkInMode = mode || "full";
  if (!["quick", "full"].includes(walkInMode)) {
    const err = new Error("mode must be either \"quick\" or \"full\"");
    err.statusCode = 400;
    throw err;
  }

  if (walkInMode === "quick") {
    const visit = await WalkInVisit.create({
      firstName,
      lastName,
      phone,
      handledBy: req.user.id,
      notes: req.body.notes,
    });
    return res.status(201).json({ success: true, data: { visit } });
  }

  if (!packageId) {
    const err = new Error("packageId is required");
    err.statusCode = 400;
    throw err;
  }

  if (!email) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  if (!password || password.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("A user with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const hashed = await hashPassword(password);

  const user = await User.create({
    firstName,
    lastName,
    phone,
    email,
    password: hashed,
    role: "trainee",
  });

  const pkg = await resolveGymPackage(packageId);
  const { startDate, endDate } = buildDates(pkg);
  const finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);

  const sub = await GymSubscription.create({
    traineeId: user._id,
    packageId: pkg._id,
    handledBy: req.user.id,
    startDate,
    endDate,
    finalAmount,
    paymentStatus: "paid",
    status: "active",
    history: [{ action: "created", date: new Date() }],
  });

  await notify({
    recipientId: user._id,
    type: "walkin_created",
    title: "Welcome to FitLink",
    body: "Your gym subscription has been created by our staff.",
    data: { subscriptionId: sub._id },
  });

  res.status(201).json({ success: true, data: { user, subscription: sub } });
});

export const listGymSubscriptions = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  if (status && !["active", "expired", "cancelled"].includes(status)) {
    const err = new Error("status must be active, expired or cancelled");
    err.statusCode = 400;
    throw err;
  }

  const filter = {};
  if (status) filter.status = status;

  let traineeIds;
  if (search) {
    const regex = new RegExp(search, "i");
    const matches = await User.find({
      role: "trainee",
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ],
    }).select("_id");
    traineeIds = matches.map((u) => u._id);
    if (traineeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { subscriptions: [], total: 0, page, limit },
      });
    }
    filter.traineeId = { $in: traineeIds };
  }

  const [subscriptions, total] = await Promise.all([
    GymSubscription.find(filter)
      .populate("traineeId", "firstName lastName email phone")
      .populate("packageId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    GymSubscription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { subscriptions, total, page, limit },
  });
});

export const purchaseSubscriptionForTrainee = asyncHandler(async (req, res) => {
  const { traineeId } = req.params;
  const { packageId } = req.body;

  if (!packageId) {
    const err = new Error("packageId is required");
    err.statusCode = 400;
    throw err;
  }

  const trainee = await User.findOne({ _id: traineeId, role: "trainee" });
  if (!trainee) {
    const err = new Error("Trainee not found");
    err.statusCode = 404;
    throw err;
  }

  const pkg = await resolveGymPackage(packageId);
  const { startDate, endDate } = buildDates(pkg);
  const finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);

  const sub = await GymSubscription.create({
    traineeId: trainee._id,
    packageId: pkg._id,
    handledBy: req.user.id,
    startDate,
    endDate,
    finalAmount,
    paymentStatus: "paid",
    status: "active",
    history: [{ action: "created", date: new Date() }],
  });

  await notify({
    recipientId: trainee._id,
    type: "subscription_created",
    title: "Gym subscription created",
    body: `Your gym subscription is active until ${endDate.toDateString()}.`,
    data: { subscriptionId: sub._id },
  });

  res.status(201).json({ success: true, data: sub });
});

export const renewSubscription = asyncHandler(async (req, res) => {
  const sub = await GymSubscription.findById(req.params.id).populate("packageId");
  if (!sub) {
    const err = new Error("Subscription not found");
    err.statusCode = 404;
    throw err;
  }

  const canManage =
    String(sub.traineeId) === String(req.user.id) ||
    ["admin", "employee"].includes(req.user.role);
  if (!canManage) {
    const err = new Error("Not authorized to renew this subscription");
    err.statusCode = 403;
    throw err;
  }

  const pkg = await Package.findOne({
    _id: sub.packageId?._id || sub.packageId,
    isActive: true,
  });
  if (!pkg || pkg.type !== "gym") {
    const err = new Error("Invalid or inactive gym package");
    err.statusCode = 400;
    throw err;
  }

  // Prevent trainees from stacking unpaid renewals: a self-service renew issues
  // a pending payment, so reject renewing while one is still outstanding.
  if (req.user.role === "trainee" && sub.paymentStatus === "pending") {
    const err = new Error("Complete the outstanding payment before renewing again.");
    err.statusCode = 409;
    throw err;
  }

  sub.finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);
  // Trainee self-renew is a self-service purchase: payment is captured async
  // via the Paymob webhook. Employee/admin renewals are physical sales and
  // remain paid immediately.
  sub.paymentStatus = req.user.role === "trainee" ? "pending" : "paid";

  if (sub.status === "cancelled") {
    // Re-subscribe: start a fresh period from today
    sub.startDate = new Date();
    sub.endDate = addMonths(new Date(), pkg.durationMonths);
  } else {
    // Extend the current period (endDate may be in the past for expired subs)
    sub.endDate = addMonths(new Date(sub.endDate), pkg.durationMonths);
  }
  sub.status = "active";
  sub.history.push({ action: "renewed", date: new Date() });
  await sub.save();

  await notify({
    recipientId: sub.traineeId,
    type: "subscription_renewed",
    title: "Gym subscription renewed",
    body: `Your gym subscription is renewed until ${sub.endDate.toDateString()}.`,
    data: { subscriptionId: sub._id },
  });

  res.status(200).json({ success: true, data: sub });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const sub = await GymSubscription.findById(req.params.id);
  if (!sub) {
    const err = new Error("Subscription not found");
    err.statusCode = 404;
    throw err;
  }

  const canManage =
    String(sub.traineeId) === String(req.user.id) ||
    ["admin", "employee"].includes(req.user.role);
  if (!canManage) {
    const err = new Error("Not authorized to cancel this subscription");
    err.statusCode = 403;
    throw err;
  }

  sub.status = "cancelled";
  sub.history.push({ action: "cancelled", date: new Date() });
  await sub.save();

  res.status(200).json({ success: true, data: sub });
});

export const getMySubscriptions = asyncHandler(async (req, res) => {
  const subs = await GymSubscription.find({ traineeId: req.user.id }).populate(
    "packageId",
  );
  res.status(200).json({ success: true, data: subs });
});