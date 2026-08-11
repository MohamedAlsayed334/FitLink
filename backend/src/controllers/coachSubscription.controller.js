import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import CoachSubscription from "../models/CoachSubscription.js";
import { calculateFinalPrice } from "../services/pricing.service.js";
import { enforceOneActiveCoach } from "../services/coachSubscription.service.js";
import { notify, notifyAllAdmins } from "../services/notification.service.js";

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function resolveCoachPackage(packageId) {
  const pkg = await Package.findOne({ _id: packageId, isActive: true });
  if (!pkg || pkg.type !== "coach") {
    const err = new Error("Invalid or inactive coach package");
    err.statusCode = 400;
    throw err;
  }
  return pkg;
}

// Shared helper: mark an overdue active coach sub as expired, release the
// one-active-coach lock and notify the trainee.
async function expireCoachSub(sub) {
  sub.status = "expired";
  sub.history.push({ action: "expired", date: new Date(), note: "Auto-expired" });
  await sub.save();

  const trainee = await User.findById(sub.traineeId);
  if (trainee && String(trainee.activeCoachSubscriptionId) === String(sub._id)) {
    trainee.activeCoachSubscriptionId = null;
    await trainee.save();
  }

  await notify({
    recipientId: sub.traineeId,
    type: "subscription_expired",
    title: "Coach subscription expired",
    body: "Your coach subscription has expired. Contact your coach to renew.",
    data: { subscriptionId: sub._id },
  });

  return sub;
}

export const createSubscription = asyncHandler(async (req, res) => {
  const { coachId, packageId } = req.body;

  const coach = await User.findOne({
    _id: coachId,
    role: "coach",
    isActive: true,
  });
  if (!coach) {
    const err = new Error("Coach not found");
    err.statusCode = 404;
    throw err;
  }

  if (!coach.coachProfile?.isVerified) {
    const err = new Error("Coach is not verified");
    err.statusCode = 400;
    throw err;
  }

  if (coach.coachProfile.isAcceptingClients !== true) {
    const err = new Error("Coach is not accepting new clients");
    err.statusCode = 400;
    throw err;
  }

  await enforceOneActiveCoach(req.user.id);

  const pkg = await resolveCoachPackage(packageId);
  const startDate = new Date();
  const endDate = addMonths(startDate, pkg.durationMonths);
  const finalAmount = calculateFinalPrice(pkg.basePrice, pkg.discountPercent);

  const sub = await CoachSubscription.create({
    traineeId: req.user.id,
    coachId: coach._id,
    packageId: pkg._id,
    startDate,
    endDate,
    status: "active",
    finalAmount,
    // Trainee self-service: payment is captured async via Paymob webhook
    paymentStatus: "pending",
    history: [{ action: "created", date: new Date() }],
  });

  req.user.activeCoachSubscriptionId = sub._id;
  await req.user.save();

  await notify({
    recipientId: req.user.id,
    type: "subscription_created",
    title: "Coach subscription created",
    body: `Your coach subscription with ${coach.firstName} ${coach.lastName} is active.`,
    data: { subscriptionId: sub._id, coachId: coach._id },
  });

  res.status(201).json({ success: true, data: sub });
});

export const requestCancellation = asyncHandler(async (req, res) => {
  const sub = await CoachSubscription.findById(req.params.id);
  if (!sub) {
    const err = new Error("Subscription not found");
    err.statusCode = 404;
    throw err;
  }

  if (String(sub.traineeId) !== String(req.user.id)) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }

  if (sub.status !== "active") {
    const err = new Error("Only active subscriptions can request cancellation");
    err.statusCode = 409;
    throw err;
  }

  if (sub.cancellationRequest?.requested === true) {
    const err = new Error("A cancellation request is already pending");
    err.statusCode = 409;
    throw err;
  }

  const reason = req.body.reason || "";
  sub.cancellationRequest = {
    requested: true,
    reason,
    requestedAt: new Date(),
  };
  sub.history.push({
    action: "cancel_requested",
    date: new Date(),
    note: reason,
  });
  await sub.save();

  const messageBody = reason || req.user.email;

  await notifyAllAdmins({
    type: "cancellation_request",
    title: "Coach subscription cancellation requested",
    body: messageBody,
    data: { subscriptionId: sub._id, traineeId: sub.traineeId },
  });

  await notify({
    recipientId: sub.coachId,
    type: "cancellation_request",
    title: "Coach subscription cancellation requested",
    body: messageBody,
    data: { subscriptionId: sub._id, traineeId: sub.traineeId },
  });

  res.status(200).json({ success: true, data: sub });
});

export const processCancellation = asyncHandler(async (req, res) => {
  const sub = await CoachSubscription.findById(req.params.id);
  if (!sub) {
    const err = new Error("Subscription not found");
    err.statusCode = 404;
    throw err;
  }

  const canApprove =
    String(sub.coachId) === String(req.user.id) || req.user.role === "admin";
  if (!canApprove) {
    const err = new Error("Not authorized to process cancellation");
    err.statusCode = 403;
    throw err;
  }

  if (sub.status !== "active" || sub.cancellationRequest?.requested !== true) {
    const err = new Error("No pending cancellation request");
    err.statusCode = 409;
    throw err;
  }

  sub.status = "cancelled";
  sub.history.push({
    action: "cancelled",
    date: new Date(),
    note: `Approved by ${req.user.role}`,
  });
  await sub.save();

  const trainee = await User.findById(sub.traineeId);
  if (trainee && String(trainee.activeCoachSubscriptionId) === String(sub._id)) {
    trainee.activeCoachSubscriptionId = null;
    await trainee.save();
  }

  await notify({
    recipientId: sub.traineeId,
    type: "cancellation_approved",
    title: "Cancellation approved",
    body: "Your coach subscription cancellation request was approved.",
    data: { subscriptionId: sub._id },
  });

  res.status(200).json({ success: true, data: sub });
});

export const rejectCancellation = asyncHandler(async (req, res) => {
  const sub = await CoachSubscription.findById(req.params.id);
  if (!sub) {
    const err = new Error("Subscription not found");
    err.statusCode = 404;
    throw err;
  }

  const canReject =
    String(sub.coachId) === String(req.user.id) || req.user.role === "admin";
  if (!canReject) {
    const err = new Error("Not authorized to reject cancellation");
    err.statusCode = 403;
    throw err;
  }

  if (sub.status !== "active" || sub.cancellationRequest?.requested !== true) {
    const err = new Error("No pending cancellation request");
    err.statusCode = 409;
    throw err;
  }

  sub.cancellationRequest = {
    requested: false,
    reason: null,
    requestedAt: null,
  };
  sub.history.push({ action: "cancel_request_rejected", date: new Date() });
  await sub.save();

  await notify({
    recipientId: sub.traineeId,
    type: "cancellation_rejected",
    title: "Cancellation rejected",
    body: "Your coach subscription cancellation request was rejected.",
    data: { subscriptionId: sub._id },
  });

  res.status(200).json({ success: true, data: sub });
});

export const getMyActiveSubscription = asyncHandler(async (req, res) => {
  let sub = await CoachSubscription.findOne({
    traineeId: req.user.id,
    status: "active",
  })
    .populate("coachId", "firstName lastName avatar coachProfile")
    .populate("packageId");

  if (sub && new Date(sub.endDate) < new Date()) {
    await expireCoachSub(sub);
    return res.status(200).json({ success: true, data: null });
  }

  if (!sub) {
    return res.status(200).json({ success: true, data: null });
  }
  res.status(200).json({ success: true, data: sub });
});

export const getCoachTrainees = asyncHandler(async (req, res) => {
  const subs = await CoachSubscription.find({
    coachId: req.user.id,
    status: "active",
  }).populate("traineeId", "firstName lastName avatar phone email");

  res.status(200).json({ success: true, data: subs });
});