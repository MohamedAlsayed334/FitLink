import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * PLACEHOLDER MODEL — scope not finalized yet.
 * Reserves the shape for whatever coach-trainee interaction feature gets
 * decided later (session booking, chat, workout plans, etc). `type` and
 * `data` stay generic on purpose until that's scoped out.
 */
const interactionSchema = new Schema(
  {
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    traineeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "CoachSubscription",
      required: true,
    },
    type: { type: String }, // e.g. "booking" | "message" | "plan" — TBD
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const interactionModel = mongoose.model("Interaction", interactionSchema);
export default interactionModel;
