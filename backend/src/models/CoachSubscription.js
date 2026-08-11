import mongoose from "mongoose";
const { Schema } = mongoose;

const historyEntrySchema = new Schema(
  {
    action: { type: String, required: true }, // "created", "cancel_requested", "cancelled", "expired", "switched"
    date: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const cancellationRequestSchema = new Schema(
  {
    requested: { type: Boolean, default: false },
    reason: { type: String },
    requestedAt: { type: Date },
  },
  { _id: false },
);

const coachSubscriptionSchema = new Schema(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },

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

    cancellationRequest: {
      type: cancellationRequestSchema,
      default: () => ({}),
    },

    // Day-thresholds already notified for (e.g. 7, 1) — prevents duplicate reminders
    expiryRemindersSent: { type: [Number], default: [] },

    history: { type: [historyEntrySchema], default: [] },
  },
  { timestamps: true },
);

// A trainee should only have ONE active coach subscription — enforce this in
// the service layer (check before insert), this index just protects against
// exact duplicate active rows for the same coach.
coachSubscriptionSchema.index({ traineeId: 1, coachId: 1, status: 1 });

// Defense-in-depth: DB rejects a second "active" row for the same trainee,
// even if the service-layer check is bypassed or racy.
coachSubscriptionSchema.index(
  { traineeId: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);

// Coach's active trainees query
coachSubscriptionSchema.index({ coachId: 1, status: 1 });

const coachSubscriptionModel = mongoose.model(
  "CoachSubscription",
  coachSubscriptionSchema,
);
export default coachSubscriptionModel;
