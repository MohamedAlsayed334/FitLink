import config from "../config/env.js";
import User from "../models/User.js";
import GymSubscription from "../models/GymSubscription.js";
import CoachSubscription from "../models/CoachSubscription.js";
import { notify } from "../services/notification.service.js";

const DAY_MS = 86400000;

async function sendReminders(subs, now) {
  for (const sub of subs) {
    const daysLeft = (sub.endDate - now) / DAY_MS;
    let changed = false;

    if (daysLeft <= 7 && !sub.expiryRemindersSent.includes(7)) {
      sub.expiryRemindersSent.push(7);
      changed = true;
      await notify({
        recipientId: sub.traineeId,
        type: "expiry_reminder",
        title: "Subscription expiring soon",
        body: `Your subscription expires on ${sub.endDate.toDateString()}. Renew now to avoid losing access.`,
        data: { subscriptionId: sub._id },
      });
    }

    if (daysLeft <= 1 && !sub.expiryRemindersSent.includes(1)) {
      sub.expiryRemindersSent.push(1);
      changed = true;
      await notify({
        recipientId: sub.traineeId,
        type: "expiry_reminder_final",
        title: "Subscription expires tomorrow",
        body: `Your subscription expires tomorrow (${sub.endDate.toDateString()}). This is the final reminder.`,
        data: { subscriptionId: sub._id },
      });
    }

    if (changed) {
      await sub.save();
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
    sub.status = "expired";
    sub.history.push({
      action: "expired",
      date: new Date(),
      note: "Auto-expired",
    });
    await sub.save();

    await notify({
      recipientId: sub.traineeId,
      type: "subscription_expired",
      title: "Gym subscription expired",
      body: "Your gym subscription has expired. Renew it to keep training.",
      data: { subscriptionId: sub._id, kind: "gym" },
    });
  }

  const expiredCoach = await CoachSubscription.find({
    status: "active",
    endDate: { $lte: now },
  });
  for (const sub of expiredCoach) {
    sub.status = "expired";
    sub.history.push({
      action: "expired",
      date: new Date(),
      note: "Auto-expired",
    });
    await sub.save();

    const trainee = await User.findById(sub.traineeId);
    if (trainee && String(trainee.activeCoachSubscriptionId) === String(sub._id)) {
      trainee.activeCoachSubscriptionId = null;
      await trainee.save();
    }

    await notify({
      recipientId: sub.traineeId,
      type: "subscription_expired",
      title: "Coach subscription expired",
      body: "Your coach subscription has expired. Contact your coach to renew.",
      data: { subscriptionId: sub._id, kind: "coach" },
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