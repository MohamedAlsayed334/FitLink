import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  listActivePackages,
  listAllPackages,
  createPackage,
  updatePackage,
  deactivatePackage,
  activatePackage,
} from "../controllers/package.controller.js";

const router = Router();


router.get("/", listActivePackages);

// for admin only
router.get("/admin/all", protect, requireRole("admin"), listAllPackages);
router.post("/", protect, requireRole("admin"), createPackage);
router.put("/:id", protect, requireRole("admin"), updatePackage);
router.patch("/:id/deactivate", protect, requireRole("admin"), deactivatePackage);
router.patch("/:id/activate", protect, requireRole("admin"), activatePackage);

export default router;