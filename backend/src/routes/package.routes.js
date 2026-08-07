import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  listActivePackages,
  createPackage,
  updatePackage,
  deactivatePackage,
} from "../controllers/package.controller.js";

const router = Router();


router.get("/", listActivePackages);

// for admin only
router.post("/", protect, requireRole("admin"), createPackage);
router.put("/:id", protect, requireRole("admin"), updatePackage);
router.patch("/:id/deactivate", protect, requireRole("admin"), deactivatePackage);

export default router;