import mongoose from "mongoose";

const bookingReservationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    username: String,
    email: String,
    phone: { type: Number, required: true, index: true },
    totalTicket: { type: Number, required: true },
    ticketType: String,

    status: {
      type: String,
      enum: ["reserved", "confirmed", "released", "expired"],
      default: "reserved",
      index: true,
    },

    expiresAt: { type: Date, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    paymentId: { type: String, default: null, index: true },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      default: null,
    },
  },
  { timestamps: true },
);

bookingReservationSchema.index(
  { eventId: 1, phone: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "reserved" },
  },
);

export default mongoose.model("BookingReservation", bookingReservationSchema);
