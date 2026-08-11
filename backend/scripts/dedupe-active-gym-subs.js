import mongoose from "mongoose";

import { connectDB } from "../src/config/db.js";

import GymSubscription from "../src/models/GymSubscription.js";

// One-time migration, run BEFORE deploying the unique partial index on
// { traineeId } where status === "active" (see models/GymSubscription.js).
//
// The duplicate-active bug let a trainee end up with more than one active gym
// subscription (one of them usually an unpaid "pending" row = free package).
// This script keeps ONE active gym sub per trainee and marks the rest
// "expired" with a history note, then (re)builds the index.
//
// Keep rule: prefer the PAID sub (the unpaid "pending" row is the free-package
// bug and must never win); among subs with the same paymentStatus, keep the
// newest. This intentionally deviates from a naive "keep newest" so a paid
// subscription is never sacrificed for an unpaid one.
async function main() {
  await connectDB();

  const duplicates = await GymSubscription.aggregate([
    { $match: { status: "active" } },
    {
      $group: {
        _id: "$traineeId",
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) {
    console.log("No duplicate active gym subscriptions found.");
  }

  for (const group of duplicates) {
    const subs = await GymSubscription.find({ _id: { $in: group.ids } }).sort({
      createdAt: 1,
    });

    const paid = subs.filter((s) => s.paymentStatus === "paid");
    const pool = paid.length > 0 ? paid : subs;
    const keep = pool[pool.length - 1];
    const others = subs.filter((s) => !s._id.equals(keep._id));

    console.log(
      `Trainee ${group._id}: keeping ${keep._id} ` +
        `(${keep.status}/${keep.paymentStatus}, end ${keep.endDate.toDateString()})`,
    );

    for (const other of others) {
      other.status = "expired";
      other.history.push({
        action: "expired",
        date: new Date(),
        note: "Deduplicated by migration",
      });
      await other.save();
      console.log(
        `  -> expired ${other._id} (${other.paymentStatus}, ` +
          `end ${other.endDate.toDateString()})`,
      );
    }
  }

  console.log("Building unique partial index on GymSubscription...");
  await GymSubscription.syncIndexes();
  const indexes = await GymSubscription.collection.indexes();
  const target = indexes.find(
    (i) => i.unique && i.partialFilterExpression?.status === "active",
  );
  if (!target) {
    throw new Error("Unique partial index not found after syncIndexes");
  }
  console.log(`Index OK: ${target.name}`);

  await mongoose.connection.close();
  console.log("Done.");
}

main().catch((error) => {
  console.error("Dedupe migration failed:", error);
  process.exit(1);
});
