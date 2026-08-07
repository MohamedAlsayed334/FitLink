import mongoose from "mongoose";
const { Schema } = mongoose;

const historyEntrySchema = new Schema(
  {
    action: { type: String, required: true }, // e.g. "created", "renewed", "cancelled"
    date: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const gymSubscriptionSchema = new Schema(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },

    // Employee/admin who processed it in person; null if trainee self-subscribed
    handledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },

    finalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },

    // Day-thresholds already notified for (e.g. 7, 1) — prevents duplicate reminders
    expiryRemindersSent: { type: [Number], default: [] },

    history: { type: [historyEntrySchema], default: [] },
  },
  { timestamps: true },
);

gymSubscriptionSchema.index({ traineeId: 1, status: 1 });

// Employee dashboard
gymSubscriptionSchema.index({ handledBy: 1, createdAt: -1 });

const gymSubscriptionModel = mongoose.model(
  "gymSubscription",
  gymSubscriptionSchema,
);
export default gymSubscriptionModel;
