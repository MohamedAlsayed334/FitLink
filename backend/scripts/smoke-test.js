import mongoose from "mongoose";
import { io as createSocketClient } from "socket.io-client";

import config from "../src/config/env.js";
import { connectDB } from "../src/config/db.js";
import app from "../src/app.js";
import { initSocketManager, closeSocket } from "../src/socket/socketManager.js";
import { registerChatSocketHandlers } from "../src/socket/chatSocket.js";
import { hashPassword } from "../src/services/auth.service.js";
import { runSweep } from "../src/jobs/subscriptionSweep.js";

import User from "../src/models/User.js";
import Package from "../src/models/Package.js";
import CoachSubscription from "../src/models/CoachSubscription.js";
import Notification from "../src/models/Notification.js";
import Rating from "../src/models/Rating.js";
import Message from "../src/models/Message.js";

if (typeof fetch !== "function") {
  console.error(
    "ERROR: global fetch is not available. This smoke test requires Node 18+.",
  );
  process.exit(1);
}

const PORT = config.SMOKE_TEST_PORT || 4100;
const BASE_URL = `http://localhost:${PORT}`;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

let PASS = 0;
let FAIL = 0;

function check(name, ok) {
  if (ok) {
    PASS += 1;
    console.log(`${GREEN}[PASS]${RESET} ${name}`);
  } else {
    FAIL += 1;
    console.log(`${RED}[FAIL]${RESET} ${name}`);
  }
}

async function step(name, fn) {
  try {
    await fn();
  } catch (error) {
    check(name, false);
    console.log(`        ${RED}threw${RESET} ${DIM}${error.message}${RESET}`);
  }
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json };
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = createSocketClient(BASE_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("socket connect timeout (4s)"));
    }, 4000);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function socketAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`ack timeout for '${event}' (4s)`)),
      4000,
    );
    socket.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

function waitForEvent(socket, event, predicate, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const handler = (data) => {
      if (predicate && !predicate(data)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(data);
    };
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(
        new Error(`Timed out waiting for socket event '${event}' (${timeoutMs}ms)`),
      );
    }, timeoutMs);
    socket.on(event, handler);
  });
}

const state = {
  httpServer: null,
  sockets: [],
  userIds: [],
  notifIds: [],
  messageIds: [],
  ratingIds: [],
  subIds: [],
  packageIds: [],
};

function closeEverything() {
  for (const s of state.sockets) {
    try {
      s.disconnect();
    } catch {
      /* ignore */
    }
  }
  state.sockets = [];
  try {
    closeSocket();
  } catch {
    /* ignore */
  }
  if (state.httpServer) {
    state.httpServer.close();
  }
}

async function cleanupDatabase() {
  try {
    const ids = state.userIds;
    if (ids.length > 0) {
      await Message.deleteMany(
        ids.length === 1
          ? { $or: [{ from: ids[0] }, { to: ids[0] }] }
          : { $or: [{ from: { $in: ids } }, { to: { $in: ids } }] },
      );
      await Notification.deleteMany({ recipientId: { $in: ids } });
      await Rating.deleteMany({ $or: [{ traineeId: { $in: ids } }, { coachId: { $in: ids } }] });
      await CoachSubscription.deleteMany({ traineeId: { $in: ids } });
      await Package.deleteMany({ _id: state.packageId });
      await User.deleteMany({ _id: { $in: ids } });
      console.log(`${DIM}cleaned up ${ids.length} seeded user(s) and related docs${RESET}`);
    }
  } catch (error) {
    console.error(`${DIM}cleanup warning: ${error.message}${RESET}`);
  }
}

async function main() {
  const ts = Date.now();
  const email = (prefix) => `smoke_${prefix}_${ts}@test.com`;
  const PASSWORD = "12345678";

  const ctx = {};

  console.log("\n" + "=".repeat(64));
  console.log("  FitLink backend smoke test (REST + realtime)");
  console.log("=".repeat(64));
  console.log(`${DIM}timestamp: ${new Date().toISOString()}${RESET}`);

  await step("connect to MongoDB", async () => {
    await connectDB();
  });

  state.httpServer = app.listen(PORT);
  initSocketManager(state.httpServer);
  registerChatSocketHandlers();
  console.log(`${DIM}http + socket.io up on ${BASE_URL}${RESET}`);

  // ---------------------------------------------------------------- seeding + auth
  await step("seed admin via User model", async () => {
    const admin = await User.create({
      email: email("admin"),
      password: await hashPassword(PASSWORD),
      role: "admin",
      firstName: "Smoke",
      lastName: "Admin",
    });
    ctx.adminId = String(admin._id);
    state.userIds.push(admin._id);
  });

  await step("admin login via POST /api/auth/login", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: { email: email("admin"), password: PASSWORD },
    });
    ctx.adminToken = res.json?.data?.token;
    check("admin login returns token", !!ctx.adminToken && res.json?.data?.user?.role === "admin");
  });

  await step("register coach + trainee", async () => {
    const coach = await api("/api/auth/register", {
      method: "POST",
      body: { email: email("coach"), password: PASSWORD, role: "coach", firstName: "Smoke", lastName: "Coach" },
    });
    ctx.coachToken = coach.json?.data?.token;
    ctx.coachId = coach.json?.data?.user?._id;
    check("register coach (201)", coach.status === 201 && !!ctx.coachToken);

    const trainee = await api("/api/auth/register", {
      method: "POST",
      body: { email: email("trainee"), password: PASSWORD, role: "trainee", firstName: "Smoke", lastName: "Trainee" },
    });
    ctx.traineeToken = trainee.json?.data?.token;
    ctx.traineeId = trainee.json?.data?.user?._id;
    check("register trainee (201)", trainee.status === 201 && !!ctx.traineeToken);

    if (ctx.coachId) state.userIds.push(ctx.coachId);
    if (ctx.traineeId) state.userIds.push(ctx.traineeId);
  });

  await step("login coach + trainee", async () => {
    const coachLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: email("coach"), password: PASSWORD },
    });
    const traineeLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: email("trainee"), password: PASSWORD },
    });
    check("coach login (200)", coachLogin.status === 200 && coachLogin.json?.data?.token);
    check("trainee login (200)", traineeLogin.status === 200 && traineeLogin.json?.data?.token);
  });

  await step("verify coach so subscription accepts them", async () => {
    const updated = await User.updateOne(
      { _id: ctx.coachId },
      { $set: { "coachProfile.isVerified": true } },
    );
    check("coachProfile.isVerified = true via direct update", updated.modifiedCount === 1);
  });

  // ---------------------------------------------------------------- admin creates package
  await step("admin creates coach package", async () => {
    const res = await api("/api/packages", {
      method: "POST",
      token: ctx.adminToken,
      body: {
        type: "coach",
        name: `Smoke Coach ${ts}`,
        durationMonths: 1,
        basePrice: 100,
        discountPercent: 0,
        isActive: true,
      },
    });
    ctx.packageId = res.json?.data?._id;
    state.packageId = ctx.packageId;
    check("POST /api/packages (admin) returns 201 + packageId", res.status === 201 && !!ctx.packageId);
  });

  // ---------------------------------------------------------------- trainee creates subscription
  await step("trainee creates coach subscription", async () => {
    const res = await api("/api/coach-subscriptions", {
      method: "POST",
      token: ctx.traineeToken,
      body: { coachId: ctx.coachId, packageId: ctx.packageId },
    });
    ctx.subscriptionId = res.json?.data?._id;
    check("POST /api/coach-subscriptions returns 201 + subId", res.status === 201 && !!ctx.subscriptionId);
  });

  await step("trainee notification persisted (subscription_created)", async () => {
    const res = await api("/api/notifications", { token: ctx.traineeToken });
    const items = res.json?.data?.items || [];
    check("GET /api/notifications lists subscription_created", items.some((n) => n.type === "subscription_created"));
  });

  // ---------------------------------------------------------------- sweep (directly seeded near-expiry sub)
  await step("runSweep sends expiry_reminder notifications", async () => {
    const trainee2 = await User.create({
      email: email("trainee2"),
      password: await hashPassword(PASSWORD),
      role: "trainee",
      firstName: "Smoke",
      lastName: "Two",
    });
    const trainee2Id = trainee2._id;
    state.userIds.push(trainee2Id);
    ctx.trainee2Id = String(trainee2Id);

    const sub = await CoachSubscription.create({
      traineeId: trainee2Id,
      coachId: ctx.coachId,
      packageId: ctx.packageId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: "active",
      finalAmount: 100,
      paymentStatus: "paid",
      history: [{ action: "created", date: new Date() }],
    });

    await runSweep();

    const notifs = await Notification.find({ recipientId: trainee2Id });
    const hasReminder = notifs.some(
      (n) => n.type === "expiry_reminder" || n.type === "expiry_reminder_final",
    );
    check("expiry_reminder notification persisted after runSweep", hasReminder);
    state.notifIds.push(...notifs.map((n) => n._id));
  });

  // ---------------------------------------------------------------- realtime rating notification
  await step("realtime: coach gets notification:new for rating", async () => {
    const coachSocket = await connectSocket(ctx.coachToken);
    state.sockets.push(coachSocket);
    ctx.coachSocket = coachSocket;

    const eventPromise = waitForEvent(
      coachSocket,
      "notification:new",
      (d) => d && d.type === "new_rating",
      3000,
    );

    const res = await api("/api/ratings", {
      method: "POST",
      token: ctx.traineeToken,
      body: {
        coachId: ctx.coachId,
        subscriptionId: ctx.subscriptionId,
        comment: "smoke test rating",
        criteria: { expertise: 5, communication: 5, professionalism: 5, punctuality: 5, valueForMoney: 5 },
      },
    });
    check("trainee submits rating (201)", res.status === 201 && res.json?.success === true);
    if (res.json?.data?._id) state.ratingIds.push(res.json.data._id);

    const received = await eventPromise.then(() => true).catch(() => false);
    check("coach socket received notification:new {type:'new_rating'}", received);
  });

  // ---------------------------------------------------------------- chat round trip
  await step("chat: full loop coach <-> trainee", async () => {
    const traineeSocket = await connectSocket(ctx.traineeToken);
    state.sockets.push(traineeSocket);

    const c2tEvent = waitForEvent(
      traineeSocket,
      "chat:message",
      (d) => d && String(d.from) === String(ctx.coachId),
    );
    const ack1 = await socketAck(ctx.coachSocket, "chat:send", {
      to: ctx.traineeId,
      body: "hello from coach (smoke)",
    });
    check("chat:send from coach acks {ok:true,message}", ack1 && ack1.ok === true && ack1.message && ack1.message.id);

    const c2t = await c2tEvent.catch(() => null);
    check("trainee receives chat:message from coach", !!c2t);
    if (c2t?.id) state.messageIds.push(c2t.id);

    const t2c = waitForEvent(
      ctx.coachSocket,
      "chat:message",
      (d) => d && String(d.from) === String(ctx.traineeId),
    );
    const ack2 = await socketAck(traineeSocket, "chat:send", {
      to: ctx.coachId,
      body: "hello from trainee (smoke)",
    });
    check("chat:send from trainee acks {ok:true}", ack2 && ack2.ok === true);

    const msg2 = await t2c.catch(() => null);
    check("coach receives chat:message from trainee", !!msg2);
    if (msg2?._id) state.messageIds.push(msg2._id);

    const convRes = await api("/api/chat/conversations", { token: ctx.coachToken });
    const convs = convRes.json?.data;
    const listed = Array.isArray(convs) && convs.some((c) => String(c.otherUserId) === String(ctx.traineeId));
    check("REST GET /api/chat/conversations lists trainee", listed);

    const readEvent = waitForEvent(
      ctx.coachSocket,
      "chat:read",
      (d) => d && String(d.by) === String(ctx.traineeId),
    );
    const ackRead = await socketAck(traineeSocket, "chat:read", { to: ctx.coachId });
    check("chat:read from trainee acks ok", ackRead && ackRead.ok === true);
    const readRecv = await readEvent.catch(() => null);
    check("coach receives chat:read", !!readRecv);
  });

  console.log("=".repeat(64));
  console.log(`SUMMARY: ${GREEN}${PASS} passed${RESET}, ${RED}${FAIL} failed${RESET}`);
}

const safeExit = async (code) => {
  closeEverything();
  try {
    await cleanupDatabase();
  } catch (error) {
    console.error("cleanup error:", error.message);
  }
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(code);
};

main()
  .then(() => safeExit(FAIL > 0 ? 1 : 0))
  .catch(async (error) => {
    console.error(`${RED}UNEXPECTED FATAL ERROR:${RESET} ${error.stack || error.message}`);
    console.log(`SUMMARY: ${GREEN}${PASS} passed${RESET}, ${RED}${FAIL} failed${RESET}`);
    await safeExit(1);
  });