import { Router } from "express";
import packageRoutes from "./package.routes.js";
const router = Router();
router.use("/packages", packageRoutes);
export default router;