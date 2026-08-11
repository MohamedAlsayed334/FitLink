import config from "../config/env.js";
import User from "../models/User.js";
import GymSubscription from "../models/GymSubscription.js";
import CoachSubscription from "../models/CoachSubscription.js";
import { notify } from "../services/notification.service.js";

const DAY_MS = 86400000;

async function sendReminders(subs, now) {
  for (const sub of subs) {
    const daysLeft = (sub.endDate - now) / DAY_MS;
    const Model = sub.constructor;

    // Reminder thresholds, each set atomically so a concurrent renew (which
    // resets expiryRemindersSent to []) cannot be clobbered by a stale save.
    const thresholds = [
      { at: 7, type: "expiry_reminder", title: "Subscription expiring soon" },
      { at: 1, type: "expiry_reminder_final", title: "Subscription expires tomorrow" },
    ];

    for (const t of thresholds) {
      if (daysLeft > t.at || sub.expiryRemindersSent.includes(t.at)) continue;

      const result = await Model.findOneAndUpdate(
        {
          _id: sub._id,
          status: "active",
          endDate: { $lte: new Date(now.getTime() + t.at * DAY_MS) },
          expiryRemindersSent: { $nin: [t.at] },
        },
        { $addToSet: { expiryRemindersSent: t.at } },
        { new: true },
      );
      if (!result) continue;

      const body =
        t.at === 7
          ? `Your subscription expires on ${result.endDate.toDateString()}. Renew now to avoid losing access.`
          : `Your subscription expires tomorrow (${result.endDate.toDateString()}). This is the final reminder.`;

      await notify({
        recipientId: result.traineeId,
        type: t.type,
        title: t.title,
        body,
        data: { subscriptionId: result._id },
      });
    }
  }
}

export async function runSweep() {
  const now = new Date();

  const expiredGym = await GymSubscription.find({
    status: "active",
    endDate: { $lte: now },
  });
  for (const sub of expiredGym) {
    // Atomic, conditional expiry: the filter re-checks status/endDate so a
    // renew that commits between our find and this update is NOT clobbered
    // back to "expired". Only notify when we actually won the claim.
    const result = await GymSubscription.findOneAndUpdate(
      { _id: sub._id, status: "active", endDate: { $lte: now } },
      {
        $set: { status: "expired" },
        $push: {
          history: { action: "expired", date: new Date(), note: "Auto-expired" },
        },
      },
      { new: true },
    );
    if (!result) continue;

    await notify({
      recipientId: result.traineeId,
      type: "subscription_expired",
      title: "Gym subscription expired",
      body: "Your gym subscription has expired. Renew it to keep training.",
      data: { subscriptionId: result._id, kind: "gym" },
    });
  }

  const expiredCoach = await CoachSubscription.find({
    status: "active",
    endDate: { $lte: now },
  });
  for (const sub of expiredCoach) {
    const result = await CoachSubscription.findOneAndUpdate(
      { _id: sub._id, status: "active", endDate: { $lte: now } },
      {
        $set: { status: "expired" },
        $push: {
          history: { action: "expired", date: new Date(), note: "Auto-expired" },
        },
      },
      { new: true },
    );
    if (!result) continue;

    const trainee = await User.findById(result.traineeId);
    if (trainee && String(trainee.activeCoachSubscriptionId) === String(result._id)) {
      trainee.activeCoachSubscriptionId = null;
      await trainee.save();
    }

    await notify({
      recipientId: result.traineeId,
      type: "subscription_expired",
      title: "Coach subscription expired",
      body: "Your coach subscription has expired. Contact your coach to renew.",
      data: { subscriptionId: result._id, kind: "coach" },
    });
  }

  const activeGyms = await GymSubscription.find({
    status: "active",
    endDate: { $gt: now },
  });
  await sendReminders(activeGyms, now);

  const activeCoach = await CoachSubscription.find({
    status: "active",
    endDate: { $gt: now },
  });
  await sendReminders(activeCoach, now);
}

let sweepTimer = null;

export function startSweepScheduler() {
  runSweep().catch((error) => {
    console.error("Initial subscription sweep failed:", error.message);
  });

  const intervalMs = config.EXPIRY_SWEEP_INTERVAL_MS || 60000;
  sweepTimer = setInterval(() => {
    runSweep().catch((error) => {
      console.error("Subscription sweep failed:", error.message);
    });
  }, intervalMs);

  return sweepTimer;
}

export function stopSweepScheduler() {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}

export default { runSweep, startSweepScheduler, stopSweepScheduler };