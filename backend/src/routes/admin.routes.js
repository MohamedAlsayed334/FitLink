import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  getDashboardSummary,
  listAllUnverifiedCoaches,
  listUsers,
  setUserStatus,
  listPendingCancellations,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/summary", protect, requireRole("admin"), getDashboardSummary);

router.get(
  "/cancellations/pending",
  protect,
  requireRole("admin"),
  listPendingCancellations,
);

router.get(
  "/coaches/unverified",
  protect,
  requireRole("admin"),
  listAllUnverifiedCoaches,
);

router.get("/users", protect, requireRole("admin"), listUsers);

router.patch("/users/:id/status", protect, requireRole("admin"), setUserStatus);

export default router;
