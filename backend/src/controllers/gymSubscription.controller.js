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

  // Guard against creating a second gym subscription while one is still active
  // or pending (unpaid) payment.
  const existingActive = await GymSubscription.findOne({
    traineeId: req.user.id,
    status: { $in: ["active", "pending"] },
    endDate: { $gt: new Date() },
  });
  if (existingActive) {
    const err = new Error(
      "You already have an active or pending gym subscription. Renew it or cancel it first.",
    );
    err.statusCode = 409;
    throw err;
  }

  const { startDate, endDate } = buildDates(pkg);
  const finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);

  const sub = await GymSubscription.create({
    traineeId: req.user.id,
    packageId: pkg._id,
    handledBy: null,
    startDate,
    endDate,
    finalAmount,
    // Trainee self-service: payment is captured async via Paymob webhook.
    // The sub stays "pending" (no access) until the webhook confirms payment.
    paymentStatus: "pending",
    status: "pending",
    history: [{ action: "created", date: new Date() }],
  });

  await notify({
    recipientId: req.user.id,
    type: "subscription_created",
    title: "Gym subscription created",
    body: `Your gym subscription is pending until payment is confirmed. Complete payment to activate it.`,
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

  if (status && !["pending", "active", "expired", "cancelled"].includes(status)) {
    const err = new Error("status must be pending, active, expired or cancelled");
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
  // Guard against duplicate active or pending gym subscriptions for the same trainee.
  const existingActive = await GymSubscription.findOne({
    traineeId: trainee._id,
    status: { $in: ["active", "pending"] },
    endDate: { $gt: new Date() },
  });
  if (existingActive) {
    const err = new Error(
      "This trainee already has an active or pending gym subscription.",
    );
    err.statusCode = 409;
    throw err;
  }
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

  const RENEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();

  // ── Atomic, idempotent, payment-gated renew ──────────────────
  // The whole guard set lives in the findOneAndUpdate filter, so only ONE
  // concurrent request can win the claim:
  //  - paymentStatus pending  => blocks renew (self-service renew issues a
  //    new pending payment; it must be paid before another renew is allowed)
  //  - cancelled / expired    => always renewable (fresh period from today)
  //  - active                 => only within the 7-day pre-expiry window
  // Once the first request lands, its update flips paymentStatus to "pending"
  // (trainee) so the second request's filter no longer matches => null => 429.
  const canRenew = {
    _id: sub._id,
    paymentStatus: { $ne: "pending" },
    $or: [
      { status: "cancelled" },
      { status: "expired" },
      {
        status: "active",
        endDate: { $lte: new Date(Date.now() + RENEW_WINDOW_MS) },
      },
    ],
  };

  let newStart;
  let newEnd;
  if (sub.status === "cancelled" || sub.status === "expired") {
    newStart = now;
    newEnd = addMonths(now, pkg.durationMonths);
  } else {
    newStart = sub.startDate;
    newEnd = addMonths(new Date(sub.endDate), pkg.durationMonths);
  }

  const isTrainee = req.user.role === "trainee";
  const newStatus = isTrainee ? "pending" : "active";
  const newPayment = isTrainee ? "pending" : "paid";

  const updated = await GymSubscription.findOneAndUpdate(
    canRenew,
    {
      $set: {
        status: newStatus,
        paymentStatus: newPayment,
        startDate: newStart,
        endDate: newEnd,
        finalAmount: calculateFinalPrice(pkg.basePrice, pkg.discountPercent),
        expiryRemindersSent: [],
      },
      $push: { history: { action: "renewed", date: new Date() } },
    },
    { new: true },
  );

  if (!updated) {
    // Lost the claim or the guards legitimately rejected the renew. Re-read to
    // report the most accurate error.
    const fresh = await GymSubscription.findById(sub._id);
    if (fresh && fresh.paymentStatus === "pending") {
      const err = new Error("Complete the outstanding payment before renewing again.");
      err.statusCode = 409;
      throw err;
    }
    if (
      fresh &&
      fresh.status === "active" &&
      new Date(fresh.endDate).getTime() > Date.now() + RENEW_WINDOW_MS
    ) {
      const err = new Error(
        "This subscription is still active and not close to expiring yet. You can renew within 7 days of its end date."
      );
      err.statusCode = 409;
      throw err;
    }
    const err = new Error("Renewal already in progress. Please wait a moment and try again.");
    err.statusCode = 429;
    throw err;
  }

  await notify({
    recipientId: updated.traineeId,
    type: "subscription_renewed",
    title: "Gym subscription renewed",
    body: isTrainee
      ? "Your gym subscription renewal is pending — complete payment to activate it."
      : `Your gym subscription is renewed until ${new Date(updated.endDate).toDateString()}.`,
    data: { subscriptionId: updated._id },
  });

  res.status(200).json({ success: true, data: updated });
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