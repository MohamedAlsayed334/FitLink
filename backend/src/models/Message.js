import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: { type: String, required: true },
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

const messageModel = mongoose.model("message", messageSchema);
export default messageModel;