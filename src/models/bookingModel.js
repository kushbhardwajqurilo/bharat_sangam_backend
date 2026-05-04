import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userName: String,
    email: String,
    u_id: { type: String, required: [true] },
    phone: { type: Number, required: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "event",
      default: null,
      index: true,
    },
    totalTicket: {
      type: Number,
      required: true,
    },
    amount: Number,
    allowVisitors: { type: Number, required: [true] },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },

    isUsed: {
      type: Boolean,
      default: false, // for entry scan
    },
    url: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);
bookingSchema.index({ u_id: 1 });
const bookingModel = mongoose.model("booking", bookingSchema);
export default bookingModel;
