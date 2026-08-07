import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import GymSubscription from "../models/GymSubscription.js";
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
    paymentStatus: "paid",
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
  const { firstName, lastName, phone, email, password, packageId } = req.body;

  if (!firstName || !lastName || !packageId) {
    const err = new Error("firstName, lastName and packageId are required");
    err.statusCode = 400;
    throw err;
  }

  if (!email && !phone) {
    const err = new Error("Either email or phone is required");
    err.statusCode = 400;
    throw err;
  }

  if (password && password.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }

  const resolvedEmail = email || `${phone}@fitlink.walkin`;
  const existing = await User.findOne({ email: resolvedEmail });
  if (existing) {
    const err = new Error("A user with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const hashed = await hashPassword(password || phone || "walkin-default-pw");

  const user = await User.create({
    firstName,
    lastName,
    phone,
    email: resolvedEmail,
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

  sub.finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);
  sub.paymentStatus = "paid";

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