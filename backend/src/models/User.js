import mongoose from "mongoose";
const { Schema } = mongoose;

const certificationSchema = new Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { _id: false },
);

const coachProfileSchema = new Schema(
  {
    specialization: { type: [String], default: [] },
    experience: { type: Number, default: 0 }, // years
    bio: { type: String, maxlength: 1000 },
    certifications: { type: [certificationSchema], default: [] },
    isVerified: { type: Boolean, default: false },
    isAcceptingClients: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "employee", "coach", "trainee"],
      required: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },

    // Trainee only — enforces "one active coach subscription" rule
    activeCoachSubscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "CoachSubscription",
      default: null,
    },

    // Coach only
    coachProfile: { type: coachProfileSchema, default: undefined },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

const userModel = mongoose.model("User", userSchema);

export default userModel;
