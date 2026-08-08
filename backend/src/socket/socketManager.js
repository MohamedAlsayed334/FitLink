import { Server } from "socket.io";
import { verifyToken } from "../services/auth.service.js";
import User from "../models/User.js";

let _io = null;
const _handlers = [];

function tokenFromHeaders(headers) {
  if (!headers?.authorization) return null;
  const match = headers.authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function initSocketManager(httpServer) {
  _io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  _io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token || tokenFromHeaders(socket.handshake.headers);

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return next(new Error("Unauthorized"));
    }

    if (!decoded || !decoded.id) {
      return next(new Error("Unauthorized"));
    }

    socket.user = { id: decoded.id, role: decoded.role };
    next();
  });

  _io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    if (socket.user.role === "admin") {
      socket.join("admins");
    }

    for (const handler of _handlers) {
      try {
        handler(socket, _io, socket.user);
      } catch (error) {
        console.error("Socket connection handler error:", error.message);
      }
    }
  });

  return _io;
}

export function registerConnectionHandler(handlerFn) {
  if (typeof handlerFn === "function") {
    _handlers.push(handlerFn);
  }
}

export function getIO() {
  return _io;
}

export function emitToUser(userId, event, data) {
  if (_io) {
    _io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToAdmins(event, data) {
  if (_io) {
    _io.to("admins").emit(event, data);
  }
}

export function closeSocket() {
  if (_io) {
    _io.close();
    _io = null;
  }
}