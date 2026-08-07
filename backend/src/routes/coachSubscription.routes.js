import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  createSubscription,
  requestCancellation,
  processCancellation,
  rejectCancellation,
  getMyActiveSubscription,
  getCoachTrainees,
} from "../controllers/coachSubscription.controller.js";

const router = Router();

router.post("/", protect, requireRole("trainee"), createSubscription);
router.get(
  "/my-trainees",
  protect,
  requireRole("coach"),
  getCoachTrainees,
);
router.get("/mine", protect, requireRole("trainee"), getMyActiveSubscription);
router.put("/:id/cancel-request", protect, requestCancellation);
router.put("/:id/process-cancel", protect, processCancellation);
router.put("/:id/cancel-reject", protect, rejectCancellation);

export default router;