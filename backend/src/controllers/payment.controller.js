import GymSubscription from "../models/GymSubscription.js";
import CoachSubscription from "../models/CoachSubscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createPaymentIntention,
  verifyWebhookHmac,
} from "../services/payment.service.js";
import { notify } from "../services/notification.service.js";

export const initiatePayment = asyncHandler(async (req, res) => {
  const { subscriptionId, subscriptionType } = req.body;

  if (!subscriptionId || !subscriptionType) {
    const error = new Error("subscriptionId and subscriptionType are required");
    error.statusCode = 400;
    throw error;
  }

  if (!["gym", "coach"].includes(subscriptionType)) {
    const error = new Error("subscriptionType must be gym or coach");
    error.statusCode = 400;
    throw error;
  }

  const Model = subscriptionType === "gym" ? GymSubscription : CoachSubscription;
  const sub = await Model.findById(subscriptionId);

  if (!sub) {
    const error = new Error("Subscription not found");
    error.statusCode = 404;
    throw error;
  }

  if (sub.traineeId.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    throw error;
  }

  if (sub.paymentStatus === "paid") {
    const error = new Error("Subscription is already paid");
    error.statusCode = 400;
    throw error;
  }

  const amountCents = Math.round(sub.finalAmount * 100);
  const trainee = req.user;
  const traineeName = `${trainee.firstName} ${trainee.lastName}`;

  const { checkoutUrl, paymobOrderId } = await createPaymentIntention({
    amountCents,
    subscriptionId: sub._id,
    subscriptionType,
    traineeEmail: trainee.email,
    traineeName,
  });

  res.status(200).json({
    success: true,
    checkoutUrl,
    paymobOrderId,
  });
});

export const paymobWebhook = asyncHandler(async (req, res) => {
  const receivedHmac = req.query.hmac;
  const transactionData = req.body?.obj;

  if (!transactionData || !verifyWebhookHmac(receivedHmac, transactionData)) {
    return res.status(200).json({ received: true });
  }

  if (transactionData?.success !== true) {
    return res.status(200).json({ received: true });
  }

  const specialRef = transactionData.order?.merchant_order_id || "";
  const subscriptionId = specialRef.split("_")[0];

  if (!subscriptionId) {
    return res.status(200).json({ received: true });
  }

  let sub = await GymSubscription.findById(subscriptionId);
  let subscriptionType = "gym";
  if (!sub) {
    sub = await CoachSubscription.findById(subscriptionId);
    subscriptionType = "coach";
  }

  if (!sub || sub.paymentStatus === "paid") {
    return res.status(200).json({ received: true });
  }

  // The webhook is the ONLY path that activates a self-service sub: it flips a
  // pending-payment "pending" sub to "paid" + "active". Self-service subs are
  // created as "pending" so a trainee gets no access until Paymob confirms.
  sub.paymentStatus = "paid";
  sub.status = "active";
  sub.history.push({ action: "payment_confirmed", note: "Paid via Paymob" });
  await sub.save();

  try {
    await notify({
      recipientId: sub.traineeId,
      type: "subscription_activated",
      title: "Subscription activated",
      body: `Your ${subscriptionType} subscription is now active until ${new Date(sub.endDate).toDateString()}.`,
      data: { subscriptionId: sub._id },
    });
  } catch (error) {
    console.error("Webhook: failed to send activation notification:", error.message);
  }

  res.status(200).json({ received: true });
});
