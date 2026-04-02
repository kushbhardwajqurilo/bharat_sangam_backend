import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userName: String,
    email: String,
    phone: String,

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "event",
      required: true,
      index: true,
    },

    tickets: {
      type: Number,
      required: true,
    },

    amount: Number,

    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },

    qrCode: {
      type: String, // store QR image URL or base64
      default: null,
    },

    isUsed: {
      type: Boolean,
      default: false, // for entry scan
    },
  },
  { timestamps: true },
);

const bookingModel = mongoose.model("booking", bookingSchema);
export default bookingModel;
