import { registerConnectionHandler, emitToUser } from "./socketManager.js";
import * as chatService from "../services/chat.service.js";

export function registerChatSocketHandlers() {
  registerConnectionHandler((socket, io, user) => {
    socket.on("chat:send", async (payload, ack) => {
      try {
        const to = payload?.to;
        const body =
          typeof payload?.body === "string" ? payload.body.trim() : "";

        if (!to) {
          const err = new Error("to is required");
          err.statusCode = 400;
          throw err;
        }
        if (!body) {
          const err = new Error("body is required");
          err.statusCode = 400;
          throw err;
        }
        if (body.length > 3000) {
          const err = new Error("body must be 3000 characters or fewer");
          err.statusCode = 400;
          throw err;
        }

        const doc = await chatService.sendMessage({ actor: user, to, body });

        emitToUser(user.id, "chat:message", doc);
        emitToUser(to, "chat:message", doc);

        if (typeof ack === "function") {
          ack({ ok: true, message: doc });
        }
      } catch (error) {
        console.error("chat:send error:", error.message);
        if (typeof ack === "function") {
          ack({ ok: false, error: error.message });
        } else {
          socket.emit("chat:error", { error: error.message });
        }
      }
    });

    socket.on("chat:read", async ({ to } = {}, ack) => {
      try {
        if (!to) {
          const err = new Error("to is required");
          err.statusCode = 400;
          throw err;
        }

        const pair =
          user.role === "coach"
            ? { coachId: user.id, traineeId: to }
            : { coachId: to, traineeId: user.id };
        const conversationId = chatService.conversationIdFor(
          pair.coachId,
          pair.traineeId,
        );

        await chatService.markConversationRead({
          actor: user,
          otherUserUserId: to,
        });

        emitToUser(to, "chat:read", { by: user.id, conversationId });

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        console.error("chat:read error:", error.message);
        if (typeof ack === "function") {
          ack({ ok: false, error: error.message });
        } else {
          socket.emit("chat:error", { error: error.message });
        }
      }
    });
  });
}

export default registerChatSocketHandlers;