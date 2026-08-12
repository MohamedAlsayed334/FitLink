import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "subscription_created",
        "subscription_activated",
        "subscription_renewed",
        "expiry_reminder",
        "expiry_reminder_final",
        "subscription_expired",
        "cancellation_request",
        "cancellation_approved",
        "cancellation_rejected",
        "coach_verified",
        "new_rating",
        "rating_moderated",
        "walkin_created",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    data: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const notificationModel = mongoose.model("Notification", notificationSchema);
export default notificationModel;