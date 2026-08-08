import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  sendMessage,
  getMessages,
  getConversations,
  markRead,
} from "../controllers/chat.controller.js";

const router = Router();

router.get("/conversations", protect, getConversations);
router.get("/:otherUserId/messages", protect, getMessages);
router.post("/", protect, sendMessage);
router.put("/:otherUserId/read", protect, markRead);

export default router;