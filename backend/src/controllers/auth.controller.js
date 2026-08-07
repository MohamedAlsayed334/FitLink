import userModel from "../models/User.js";
import {
  hashPassword,
  comparePassword,
  signToken,
} from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const ALLOWED_LST = ["trainee", "coach"];

export const register = asyncHandler(async (req, res) => {
  const { email, password, role, firstName, lastName, phone } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    const error = new Error("Please fill all required fields");
    error.statusCode = 400;
    throw error;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    const error = new Error("Please provide a valid email");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_LST.includes(role)) {
    const error = new Error("Role must be either trainee or coach");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const userData = {
    email,
    password: hashedPassword,
    role,
    firstName,
    lastName,
    phone,
  };

  if (role === "coach") {
    userData.coachProfile = {
      specialization: [],
      experience: 0,
      certifications: [],
      isVerified: false,
      isAcceptingClients: true,
      averageRating: 0,
      totalReviews: 0,
    };
  }

  const user = await userModel.create(userData);

  const token = signToken({ id: user._id, role: user.role });

  return res.status(201).json({ success: true, data: { token, user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findOne({ email }).select("+password");

  if (!user || !(await comparePassword(password, user.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.isActive === false) {
    const error = new Error("Account is deactivated");
    error.statusCode = 401;
    throw error;
  }

  const token = signToken({ id: user._id, role: user.role });

  user.password = undefined;

  return res.status(200).json({ success: true, data: { token, user } });
});