import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import GymSubscription from "../models/GymSubscription.js";
import CoachSubscription from "../models/CoachSubscription.js";
import Rating from "../models/Rating.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    byRole,
    activeGym,
    activeCoach,
    paidGym,
    paidCoach,
    pendingCancellations,
    pendingReviews,
    unverifiedCoaches,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    GymSubscription.countDocuments({ status: "active" }),
    CoachSubscription.countDocuments({ status: "active" }),
    GymSubscription.find({ status: "active", paymentStatus: "paid" }).select(
      "finalAmount",
    ),
    CoachSubscription.find({
      status: "active",
      paymentStatus: "paid",
    }).select("finalAmount"),
    CoachSubscription.countDocuments({
      "cancellationRequest.requested": true,
    }),
    Rating.countDocuments({ moderationStatus: "pending" }),
    User.countDocuments({ role: "coach", "coachProfile.isVerified": false }),
  ]);

  const users = { admin: 0, employee: 0, coach: 0, trainee: 0 };
  for (const row of byRole) {
    users[row._id] = row.count;
  }

  const totalRevenue =
    paidGym.reduce((a, s) => a + s.finalAmount, 0) +
    paidCoach.reduce((a, s) => a + s.finalAmount, 0);

  res.status(200).json({
    success: true,
    data: {
      users,
      totalUsers: Object.values(users).reduce((a, b) => a + b, 0),
      activeGymSubscriptions: activeGym,
      activeCoachSubscriptions: activeCoach,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingCancellations,
      pendingReviews,
      unverifiedCoaches,
    },
  });
});