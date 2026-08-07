import asyncHandler from "../utils/asyncHandler.js";
import Notification from "../models/Notification.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50),
    Notification.countDocuments({ recipientId: req.user.id, read: false }),
  ]);

  res.status(200).json({ success: true, data: { items, unreadCount } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipientId: req.user.id,
  });
  if (!notification) {
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipientId: req.user.id, read: false },
    { read: true },
  );

  res.status(200).json({
    success: true,
    data: { modifiedCount: result.modifiedCount },
  });
});

export default { getMyNotifications, markAsRead, markAllRead };