import { Router } from "express";
import packageRoutes from "./package.routes.js";
import authRoutes from "./auth.routes.js";
const router = Router();
router.use("/packages", packageRoutes);
router.use("/auth", authRoutes);
export default router;