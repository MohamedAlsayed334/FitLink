import mongoose from "mongoose";
const { Schema } = mongoose;

const walkInVisitSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

// Employee dashboard
walkInVisitSchema.index({ handledBy: 1, createdAt: -1 });

const walkInVisitModel = mongoose.model("WalkInVisit", walkInVisitSchema);
export default walkInVisitModel;
