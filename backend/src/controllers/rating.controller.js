import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import CoachSubscription from "../models/CoachSubscription.js";
import Rating from "../models/Rating.js";
import { recalculateCoachAverage } from "../services/rating.service.js";

const criteriaKeys = [
  "expertise",
  "communication",
  "professionalism",
  "punctuality",
  "valueForMoney",
];

export const submitRating = asyncHandler(async (req, res) => {
  const { coachId, subscriptionId, comment } = req.body;
  const criteria = req.body.criteria || {};

  for (const key of criteriaKeys) {
    const val = criteria[key];
    if (typeof val !== "number" || val < 1 || val > 5) {
      const err = new Error(
        `Criteria '${key}' must be a number between 1 and 5`,
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const sub = await CoachSubscription.findById(subscriptionId);
  if (!sub) {
    const err = new Error("Subscription not found");
    err.statusCode = 404;
    throw err;
  }
  if (String(sub.traineeId) !== String(req.user.id)) {
    const err = new Error("Subscription does not belong to this trainee");
    err.statusCode = 403;
    throw err;
  }
  if (coachId && String(sub.coachId) !== String(coachId)) {
    const err = new Error("Subscription does not reference this coach");
    err.statusCode = 400;
    throw err;
  }

  const existing = await Rating.findOne({ subscriptionId });
  if (existing) {
    const err = new Error("This subscription has already been rated");
    err.statusCode = 409;
    throw err;
  }

  const overallRating =
    Math.round(
      (criteriaKeys.reduce((acc, k) => acc + criteria[k], 0) /
        criteriaKeys.length) *
        10,
    ) / 10;

  const rating = await Rating.create({
    coachId: sub.coachId,
    traineeId: req.user.id,
    subscriptionId,
    criteria,
    overallRating,
    comment,
    moderationStatus: "pending",
    isVisible: false,
  });

  res.status(201).json({ success: true, data: rating });
});

export const getCoachReviews = asyncHandler(async (req, res) => {
  const { coachId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  if (!mongoose.Types.ObjectId.isValid(coachId)) {
    const err = new Error("Invalid coach id");
    err.statusCode = 400;
    throw err;
  }

  const filter = {
    coachId,
    isVisible: true,
    moderationStatus: "approved",
  };

  const [total, reviews] = await Promise.all([
    Rating.countDocuments(filter),
    Rating.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("traineeId", "firstName lastName avatar"),
  ]);

  res.status(200).json({
    success: true,
    data: { reviews, total, limit, offset },
  });
});

export const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Rating.find({ moderationStatus: "pending" })
    .sort({ createdAt: -1 })
    .populate("traineeId", "firstName lastName avatar")
    .populate("coachId", "firstName lastName avatar");
  res.status(200).json({ success: true, data: reviews });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const { moderationStatus, moderationNote } = req.body;

  if (!["approved", "rejected"].includes(moderationStatus)) {
    const err = new Error("moderationStatus must be 'approved' or 'rejected'");
    err.statusCode = 400;
    throw err;
  }

  const rating = await Rating.findById(req.params.id);
  if (!rating) {
    const err = new Error("Rating not found");
    err.statusCode = 404;
    throw err;
  }

  rating.moderationStatus = moderationStatus;
  rating.isVisible = moderationStatus === "approved";
  if (moderationNote !== undefined) rating.moderationNote = moderationNote;
  await rating.save();

  await recalculateCoachAverage(rating.coachId);

  res.status(200).json({ success: true, data: rating });
});