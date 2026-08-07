import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  submitRating,
  getCoachReviews,
  getPendingReviews,
  moderateReview,
} from "../controllers/rating.controller.js";

const router = Router();

router.get(
  "/pending",
  protect,
  requireRole("admin"),
  getPendingReviews,
);
router.post("/", protect, requireRole("trainee"), submitRating);
router.get("/coaches/:coachId/ratings", getCoachReviews);
router.put("/:id/moderate", protect, requireRole("admin"), moderateReview);

export default router;