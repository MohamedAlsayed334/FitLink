import mongoose from "mongoose";
const { Schema } = mongoose;

const criteriaSchema = new Schema(
  {
    expertise: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    professionalism: { type: Number, required: true, min: 1, max: 5 },
    punctuality: { type: Number, required: true, min: 1, max: 5 },
    valueForMoney: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const ratingSchema = new Schema(
  {
    coachId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    traineeId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Must reference a real subscription the trainee had with this coach
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "CoachSubscription",
      required: true,
    },

    criteria: { type: criteriaSchema, required: true },
    overallRating: { type: Number, min: 1, max: 5, required: true }, // avg of criteria, computed in service layer

    comment: { type: String, maxlength: 1000 },

    isVisible: { type: Boolean, default: false }, // flips true only after admin approval
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderationNote: { type: String },
  },
  { timestamps: true },
);

// One rating per subscription — prevents duplicate reviews for the same sub
ratingSchema.index({ subscriptionId: 1 }, { unique: true });
ratingSchema.index({ coachId: 1, isVisible: 1 });

// Admin moderation queue
ratingSchema.index({ moderationStatus: 1, createdAt: -1 });

const ratingModel = mongoose.model("rating", ratingSchema);
export default ratingModel;
