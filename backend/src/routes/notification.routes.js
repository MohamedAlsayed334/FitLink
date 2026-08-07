import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getMyNotifications,
  markAsRead,
  markAllRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", protect, getMyNotifications);
router.put("/read-all", protect, markAllRead);
router.put("/:id/read", protect, markAsRead);

export default router;