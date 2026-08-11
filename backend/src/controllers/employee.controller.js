import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import GymSubscription from "../models/GymSubscription.js";
import CoachSubscription from "../models/CoachSubscription.js";
import WalkInVisit from "../models/WalkInVisit.js";

const SAFE_USER_FIELDS =
  "firstName lastName email phone avatar isActive role createdAt";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getEmployeeStats = asyncHandler(async (req, res) => {
  const today = startOfToday();
  const monthEnd = endOfMonth();

  const [
    todayWalkIns,
    todaySignups,
    activeMembers,
    expiringThisMonth,
    paidToday,
  ] = await Promise.all([
    WalkInVisit.countDocuments({ createdAt: { $gte: today } }),
    GymSubscription.countDocuments({ createdAt: { $gte: today } }),
    GymSubscription.countDocuments({ status: "active", paymentStatus: "paid" }),
    GymSubscription.countDocuments({
      status: "active",
      paymentStatus: "paid",
      endDate: { $gte: new Date(), $lte: monthEnd },
    }),
    GymSubscription.find({
      paymentStatus: "paid",
      createdAt: { $gte: today },
    }).select("finalAmount"),
  ]);

  const revenueToday =
    Math.round(paidToday.reduce((a, s) => a + s.finalAmount, 0) * 100) / 100;

  res.status(200).json({
    success: true,
    data: {
      todayWalkIns,
      todaySignups,
      activeMembers,
      expiringThisMonth,
      revenueToday,
    },
  });
});

export const listWalkIns = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 200);

  const visits = await WalkInVisit.find()
    .populate("handledBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({ success: true, data: { visits } });
});

export const listTrainees = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

  const gymMemberIds = await GymSubscription.distinct("traineeId");
  if (gymMemberIds.length === 0) {
    return res.status(200).json({ success: true, data: { trainees: [] } });
  }

  const filter = { role: "trainee", _id: { $in: gymMemberIds } };
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const trainees = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(SAFE_USER_FIELDS);

  res.status(200).json({ success: true, data: { trainees } });
});

export const getTraineeProfile = asyncHandler(async (req, res) => {
  const trainee = await User.findOne({
    _id: req.params.id,
    role: "trainee",
  }).select(SAFE_USER_FIELDS);

  if (!trainee) {
    const err = new Error("Trainee not found");
    err.statusCode = 404;
    throw err;
  }

  const [gymSubscriptions, coachSubscriptions] = await Promise.all([
    GymSubscription.find({ traineeId: trainee._id })
      .populate("packageId")
      .sort({ createdAt: -1 }),
    CoachSubscription.find({ traineeId: trainee._id })
      .populate("coachId", "firstName lastName avatar email")
      .populate("packageId")
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    data: { trainee, gymSubscriptions, coachSubscriptions },
  });
});
