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

export const listAllUnverifiedCoaches = asyncHandler(async (req, res) => {
  const coaches = await User.find({
    role: "coach",
    $or: [
      { "coachProfile.isVerified": false },
      { coachProfile: { $exists: false } },
      { coachProfile: null },
    ],
  }).select("firstName lastName email phone avatar coachProfile");

  res.status(200).json({ success: true, data: coaches });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, isActive } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    ];
  }
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .select("firstName lastName email phone role avatar isActive coachProfile.isVerified");

  res.status(200).json({ success: true, data: users });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    const err = new Error("isActive must be a boolean");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({ success: true, data: user });
});

export const listPendingCancellations = asyncHandler(async (req, res) => {
  const subs = await CoachSubscription.find({
    status: "active",
    "cancellationRequest.requested": true,
  })
    .populate("traineeId", "firstName lastName email avatar")
    .populate("coachId", "firstName lastName avatar")
    .populate("packageId", "name durationMonths")
    .sort({ "cancellationRequest.requestedAt": -1 });

  const data = subs.map((sub) => ({
    id: sub._id,
    trainee: sub.traineeId,
    coach: sub.coachId,
    package: sub.packageId,
    reason: sub.cancellationRequest?.reason || "",
    requestedAt: sub.cancellationRequest?.requestedAt,
    endDate: sub.endDate,
    finalAmount: sub.finalAmount,
  }));

  res.status(200).json({ success: true, data });
});