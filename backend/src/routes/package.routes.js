import { Router } from "express";
import {
  listActivePackages,
  createPackage,
  updatePackage,
  deactivatePackage,
} from "../controllers/package.controller.js";

const router = Router();


router.get("/", listActivePackages);

// for admin only (auth w role gotta be added)
router.post("/", createPackage);
router.put("/:id", updatePackage);
router.patch("/:id/deactivate", deactivatePackage);

export default router;