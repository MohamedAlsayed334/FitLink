import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToUser, emitToAdmins } from "../socket/socketManager.js";

export async function notify({ recipientId, type, title, body, data }) {
  if (!recipientId) return null;
  const doc = await Notification.create({
    recipientId,
    type,
    title,
    body,
    data: data || {},
  });
  if (doc) {
    try {
      emitToUser(recipientId, "notification:new", doc);
    } catch (error) {
      console.error("Failed to emit notification to user:", error.message);
    }
  }
  return doc;
}

export async function notifyMany(recipientIds, payload) {
  const ids = (recipientIds || []).filter((id) => id);
  if (ids.length === 0) return 0;

  const docs = ids.map((recipientId) => ({
    recipientId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  }));

  const created = await Notification.insertMany(docs);
  for (const doc of created) {
    try {
      emitToUser(String(doc.recipientId), "notification:new", doc);
    } catch (error) {
      console.error("Failed to emit notification to user:", error.message);
    }
  }
  return created.length;
}

export async function notifyAllAdmins(payload) {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id");
  const ids = (admins || []).map((a) => a._id).filter(Boolean);
  if (ids.length === 0) return 0;

  const created = await Notification.insertMany(
    ids.map((recipientId) => ({
      recipientId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    })),
  );

  for (const doc of created) {
    try {
      emitToAdmins("notification:new", doc);
    } catch (error) {
      console.error("Failed to emit notification to admins:", error.message);
    }
  }
  return created.length;
}

export default { notify, notifyMany, notifyAllAdmins };