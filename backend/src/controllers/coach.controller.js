import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

export const updateCoachProfile = asyncHandler(async (req, res) => {
  const coach = req.user;
  if (!coach.coachProfile) {
    coach.coachProfile = {
      specialization: [],
      experience: 0,
      certifications: [],
      isVerified: false,
      isAcceptingClients: true,
      averageRating: 0,
      totalReviews: 0,
    };
  }

  const allowed = [
    "specialization",
    "experience",
    "bio",
    "certifications",
    "isAcceptingClients",
  ];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      coach.coachProfile[field] = req.body[field];
    }
  }

  await coach.save();
  res.status(200).json({ success: true, data: coach });
});

export const listCoaches = asyncHandler(async (req, res) => {
  const { specialization, minRating, limit = 20, offset = 0 } = req.query;

  const filter = {
    role: "coach",
    isActive: true,
    "coachProfile.isVerified": true,
  };

  if (minRating) {
    filter["coachProfile.averageRating"] = { $gte: parseFloat(minRating) };
  }

  const coaches = await User.find(filter);

  let result = coaches;
  if (specialization) {
    const desired = Array.isArray(specialization)
      ? specialization
      : [specialization];
    result = coaches.filter((c) =>
      desired.every((s) => (c.coachProfile.specialization || []).includes(s)),
    );
  }

  result.sort(
    (a, b) =>
      (b.coachProfile.averageRating || 0) - (a.coachProfile.averageRating || 0),
  );
  result = result.slice(
    parseInt(offset, 10) || 0,
    (parseInt(offset, 10) || 0) + parseInt(limit, 10),
  );

  res.status(200).json({ success: true, data: result });
});

export const getCoachById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error("Invalid coach id");
    err.statusCode = 400;
    throw err;
  }

  const coach = await User.findOne({
    _id: req.params.id,
    role: "coach",
    isActive: true,
    "coachProfile.isVerified": true,
  });
  if (!coach) {
    const err = new Error("Coach not found");
    err.statusCode = 404;
    throw err;
  }
  res.status(200).json({ success: true, data: coach });
});

export const verifyCoach = asyncHandler(async (req, res) => {
  const coach = await User.findById(req.params.id);
  if (!coach || coach.role !== "coach") {
    const err = new Error("Coach not found");
    err.statusCode = 404;
    throw err;
  }
  if (!coach.coachProfile) {
    coach.coachProfile = {
      specialization: [],
      experience: 0,
      certifications: [],
      isVerified: false,
      isAcceptingClients: true,
      averageRating: 0,
      totalReviews: 0,
    };
  }
  coach.coachProfile.isVerified = true;
  await coach.save();

  res.status(200).json({ success: true, data: coach });
});