import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  listCoaches,
  getCoachById,
  updateCoachProfile,
  verifyCoach,
} from "../controllers/coach.controller.js";

const router = Router();

router.get("/", listCoaches);
router.put("/profile", protect, requireRole("coach"), updateCoachProfile);
router.get("/:id", getCoachById);
router.put("/:id/verify", protect, requireRole("admin"), verifyCoach);

export default router;