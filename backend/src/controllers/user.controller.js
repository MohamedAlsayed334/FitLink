import asyncHandler from "../utils/asyncHandler.js";

const commonFields = ["firstName", "lastName", "phone", "avatar"];

export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const update = {};
  for (const field of commonFields) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }

  if (Object.keys(update).length) {
    req.user.set(update);
    await req.user.save();
  }

  res.status(200).json({ success: true, data: req.user });
});