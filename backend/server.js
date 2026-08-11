// Node.js v18 polyfill: mongodb driver v7+ and bson use `crypto` as a global
// (Web Crypto API). Node v19+ exposes this automatically; v18 needs this line.
import { webcrypto } from "crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

import mongoose from "mongoose";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import config from "./src/config/env.js";
import {
  startSweepScheduler,
  stopSweepScheduler,
} from "./src/jobs/subscriptionSweep.js";
import { initSocketManager, closeSocket } from "./src/socket/socketManager.js";
import { registerChatSocketHandlers } from "./src/socket/chatSocket.js";

async function startServer() {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
    console.log(`Health check: http://localhost:${config.PORT}/api/health`);
  });

  initSocketManager(server);
  registerChatSocketHandlers();
  startSweepScheduler();

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    stopSweepScheduler();
    try {
      closeSocket();
    } catch (error) {
      console.error("Error closing socket server:", error.message);
    }
    server.close(async () => {
      try {
        await mongoose.disconnect();
      } catch (error) {
        console.error("Error disconnecting from MongoDB:", error.message);
      }
      console.log("Server closed.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after 10s timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
