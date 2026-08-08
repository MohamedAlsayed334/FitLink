import asyncHandler from "../utils/asyncHandler.js";
import * as chatService from "../services/chat.service.js";
import { emitToUser } from "../socket/socketManager.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { to, body } = req.body;
  const doc = await chatService.sendMessage({
    actor: { id: String(req.user._id), role: req.user.role },
    to,
    body,
  });
  try {
    emitToUser(String(req.user._id), "chat:message", doc);
    emitToUser(String(to), "chat:message", doc);
  } catch (error) {
    console.error("Failed to emit chat:message:", error.message);
  }
  res.status(201).json({ success: true, data: doc });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const data = await chatService.getMessages({
    actor: { id: String(req.user._id), role: req.user.role },
    otherUserId,
    page,
    limit,
  });
  res.status(200).json({ success: true, data });
});

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user._id);
  res.status(200).json({ success: true, data: conversations });
});

export const markRead = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;
  const modifiedCount = await chatService.markConversationRead({
    actor: { id: String(req.user._id), role: req.user.role },
    otherUserUserId: otherUserId,
  });
  try {
    emitToUser(String(otherUserId), "chat:read", {
      by: String(req.user._id),
      conversationId: null,
    });
  } catch (error) {
    console.error("Failed to emit chat:read:", error.message);
  }
  res.status(200).json({ success: true, data: { modifiedCount } });
});

export default { sendMessage, getMessages, getConversations, markRead };