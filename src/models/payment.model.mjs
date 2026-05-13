import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      type: String,
      required: true,
    },

    notes: {
      type: Object,
      default: {},
    },

    method: String,
    email: String,
    contact: String,

    razorpaySignature: String,

    paidAt: Date,

    webhookLogs: [
      {
        event: String,
        payload: Object,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
