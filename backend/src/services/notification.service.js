import Notification from "../models/Notification.js";
import User from "../models/User.js";

export async function notify({ recipientId, type, title, body, data }) {
  if (!recipientId) return null;
  return Notification.create({
    recipientId,
    type,
    title,
    body,
    data: data || {},
  });
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
  return created.length;
}

export async function notifyAllAdmins(payload) {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id");
  return notifyMany(
    admins.map((a) => a._id),
    payload,
  );
}

export default { notify, notifyMany, notifyAllAdmins };