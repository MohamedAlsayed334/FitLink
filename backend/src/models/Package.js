import mongoose from "mongoose";
const { Schema } = mongoose;

const packageSchema = new Schema(
  {
    type: { type: String, enum: ["gym", "coach"], required: true },
    name: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, enum: [1, 3] },
    basePrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Virtual: computed final price after discount
packageSchema.virtual("finalPrice").get(function () {
  const discount = (this.basePrice * this.discountPercent) / 100;
  return Math.round((this.basePrice - discount) * 100) / 100;
});

packageSchema.set("toJSON", { virtuals: true });
packageSchema.set("toObject", { virtuals: true });

const packageModel = mongoose.model("Package", packageSchema);
export default packageModel;
