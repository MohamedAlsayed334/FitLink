import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  createSubscription,
  registerWalkInTrainee,
  renewSubscription,
  cancelSubscription,
  getMySubscriptions,
  listGymSubscriptions,
  purchaseSubscriptionForTrainee,
} from "../controllers/gymSubscription.controller.js";

const router = Router();

router.post("/", protect, requireRole("trainee"), createSubscription);
router.post(
  "/walk-in",
  protect,
  requireRole("admin", "employee"),
  registerWalkInTrainee,
);
router.get("/", protect, requireRole("admin", "employee"), listGymSubscriptions);
router.post(
  "/:traineeId/purchase",
  protect,
  requireRole("admin", "employee"),
  purchaseSubscriptionForTrainee,
);
router.get("/mine", protect, requireRole("trainee"), getMySubscriptions);
router.put("/:id/renew", protect, renewSubscription);
router.put("/:id/cancel", protect, cancelSubscription);

export default router;