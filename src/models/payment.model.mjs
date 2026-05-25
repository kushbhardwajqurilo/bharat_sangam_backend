import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "events",
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    receipt: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["created", "attempted", "paid", "failed", "refunded"],
      default: "created",
    },

    phone: {
      type: Number,
      required: true,
    },

    notes: {
      type: Object,
      default: {},
    },

    method: String,
    email: String,
    razorpaySignature: String,

    paidAt: Date,
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } },
);
const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
