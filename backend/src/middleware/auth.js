import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyToken } from "../services/auth.service.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Not authorized, no token provided");
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        const err = new Error("Invalid token");
        err.statusCode = 401;
        throw err;
      }
      if (error instanceof jwt.TokenExpiredError) {
        const err = new Error("Token expired");
        err.statusCode = 401;
        throw err;
      }
      throw error;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 401;
      throw err;
    }
    if (user.isActive === false) {
      const err = new Error("Account is deactivated. Contact an admin.");
      err.statusCode = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export default protect;
