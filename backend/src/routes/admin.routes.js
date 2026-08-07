import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { getDashboardSummary } from "../controllers/admin.controller.js";

const router = Router();

router.get(
  "/summary",
  protect,
  requireRole("admin"),
  getDashboardSummary,
);

export default router;