import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/env.js";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function signToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}