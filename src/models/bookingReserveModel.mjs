import mongoose from "mongoose";

const bookingReservationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: Number,
      required: true,
      index: true,
    },
    totalTicket: {
      type: Number,
      required: true,
      min: 1,
    },
    ticketType: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["reserved", "confirmed", "released", "expired"],
      default: "reserved",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

// Prevent multiple concurrent active reservations for the same event and phone
bookingReservationSchema.index(
  { eventId: 1, phone: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "reserved" },
  },
);

const BookingReservation = mongoose.model(
  "BookingReservation",
  bookingReservationSchema,
);

export default BookingReservation;
