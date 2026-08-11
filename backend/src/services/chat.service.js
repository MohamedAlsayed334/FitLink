import User from "../models/User.js";
import Message from "../models/Message.js";
import CoachSubscription from "../models/CoachSubscription.js";

export function conversationIdFor(coachId, traineeId) {
  return `${String(coachId)}_${String(traineeId)}`;
}

export async function assertCanChat(actorUser, targetId) {
  let pair;
  if (actorUser.role === "coach") {
    pair = { coachId: actorUser.id, traineeId: targetId };
  } else if (actorUser.role === "trainee") {
    pair = { coachId: targetId, traineeId: actorUser.id };
  } else {
    const err = new Error("Only coaches and trainees can message");
    err.statusCode = 403;
    throw err;
  }

  const target = await User.findById(targetId);
  if (!target) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (actorUser.role === "coach" && target.role !== "trainee") {
    const err = new Error("Only trainees can be messaged by coaches");
    err.statusCode = 403;
    throw err;
  }
  if (actorUser.role === "trainee" && target.role !== "coach") {
    const err = new Error("Only coaches can be messaged by trainees");
    err.statusCode = 403;
    throw err;
  }

  const subscription = await CoachSubscription.findOne({
    coachId: pair.coachId,
    traineeId: pair.traineeId,
  });
  if (!subscription) {
    const err = new Error("Chat requires a coach-trainee relationship");
    err.statusCode = 403;
    throw err;
  }

  return pair;
}

export async function sendMessage({ actor, to, body }) {
  const pair = await assertCanChat(actor, to);
  const conversationId = conversationIdFor(pair.coachId, pair.traineeId);
  return Message.create({
    conversationId,
    from: actor.id,
    to,
    body,
  });
}

export async function getMessages({ actor, otherUserId, page = 1, limit = 50 }) {
  const pair = await assertCanChat(actor, otherUserId);
  const conversationId = conversationIdFor(pair.coachId, pair.traineeId);

  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Message.countDocuments({ conversationId }),
  ]);

  return { messages, total };
}

export async function getConversations(userId) {
  const userIdStr = String(userId);

  const me = await User.findById(userId).select("_id role").lean();
  if (!me) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // ---- message-based conversations (real conversations) ----
  const data = await Message.aggregate([
    { $match: { $or: [{ from: userId }, { to: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    { $limit: 50 },
  ]);

  const conversationIds = data.map((d) => d._id);

  let unreadByConversation = {};
  if (conversationIds.length > 0) {
    const unreadDocs = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          to: userId,
          readAt: null,
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    unreadByConversation = Object.fromEntries(
      unreadDocs.map((d) => [d._id, d.count]),
    );
  }

  const otherUserIds = data
    .map((d) => {
      const msg = d.lastMessage;
      return String(msg.from) === userIdStr
        ? String(msg.to)
        : String(msg.from);
    })
    .filter((id) => id);

  const otherUsers = await User.find({ _id: { $in: otherUserIds } }).select(
    "_id role firstName lastName avatar",
  );
  const otherUserById = new Map(
    otherUsers.map((u) => [String(u._id), u]),
  );

  const conversations = [];
  const seen = new Set();

  for (const d of data) {
    const msg = d.lastMessage;
    const otherUserId =
      String(msg.from) === userIdStr ? String(msg.to) : String(msg.from);
    const peer = otherUserById.get(otherUserId);
    conversations.push({
      conversationId: d._id,
      otherUserId,
      otherUserRole: peer?.role || null,
      firstName: peer?.firstName || null,
      lastName: peer?.lastName || null,
      avatar: peer?.avatar || null,
      lastMessage: {
        body: msg.body,
        createdAt: msg.createdAt,
        from: String(msg.from),
      },
      unread: unreadByConversation[d._id] || 0,
      hasMessages: true,
    });
    seen.add(d._id);
  }

  // ---- subscription-derived "pending" conversations ----
  // A coach/trainee pair with an active CoachSubscription is chat-eligible even
  // before the first message exists. Derive those peers so the chat screen can
  // show every trainee (or the coach) up front. Any peer that already has a
  // real message conversation is skipped to avoid duplicates.
  const subs =
    me.role === "coach"
      ? await CoachSubscription.find({ coachId: me._id, status: "active" })
          .select("coachId traineeId")
          .lean()
      : me.role === "trainee"
        ? await CoachSubscription.find({ traineeId: me._id, status: "active" })
            .select("coachId traineeId")
            .lean()
        : [];

  if (subs.length > 0) {
    const peerIds = subs.map((s) =>
      me.role === "coach" ? String(s.traineeId) : String(s.coachId),
    );
    const pendingUsers = await User.find({ _id: { $in: peerIds } }).select(
      "_id role firstName lastName avatar",
    );
    const pendingById = new Map(
      pendingUsers.map((u) => [String(u._id), u]),
    );

    for (const sub of subs) {
      const otherUserId =
        me.role === "coach" ? String(sub.traineeId) : String(sub.coachId);
      const conversationId =
        me.role === "coach"
          ? conversationIdFor(userIdStr, otherUserId)
          : conversationIdFor(otherUserId, userIdStr);
      if (seen.has(conversationId)) continue;
      const peer = pendingById.get(otherUserId);
      conversations.push({
        conversationId,
        otherUserId,
        otherUserRole:
          peer?.role || (me.role === "coach" ? "trainee" : "coach"),
        firstName: peer?.firstName || null,
        lastName: peer?.lastName || null,
        avatar: peer?.avatar || null,
        lastMessage: null,
        unread: 0,
        hasMessages: false,
      });
      seen.add(conversationId);
    }
  }

  return conversations;
}

export async function markConversationRead({
  actor,
  otherUserUserId,
}) {
  const pair = await assertCanChat(actor, otherUserUserId);
  const conversationId = conversationIdFor(pair.coachId, pair.traineeId);

  const result = await Message.updateMany(
    { conversationId, to: actor.id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return result.modifiedCount;
}

export default {
  conversationIdFor,
  assertCanChat,
  sendMessage,
  getMessages,
  getConversations,
  markConversationRead,
};