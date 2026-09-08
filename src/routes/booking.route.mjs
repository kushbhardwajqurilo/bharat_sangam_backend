import express from "express";
import {
  createBookingOrder,
  verifyAndCreateTicket,
  createTicket,
  getAllBookings,
  getSingleBookingDetails,
  getTicketDetails,
  getTicketDetailsByPhone,
  nonVisitUser,
  verifyTicket,
} from "../controllers/booking.controller.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
  volunteerAuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import { validateRequest } from "../middlewares/validationMiddleware.mjs";
import {
  createBookingOrderSchema,
  verifyAndCreateTicketSchema,
} from "../validations/booking.validation.mjs";

const BookingRouter = express.Router();

/**
 * 🔒 Razorpay Reservation-First Flow
 */
// 1. Create Razorpay order & reserve seats
BookingRouter.post(
  "/create-order",
  validateRequest(createBookingOrderSchema),
  createBookingOrder,
);

// 2. Cryptographically verify payment & confirm ticket
BookingRouter.post(
  "/verify-and-create-ticket",
  validateRequest(verifyAndCreateTicketSchema),
  verifyAndCreateTicket,
);

// Legacy direct ticket creation route
BookingRouter.post("/create-ticket", createTicket);

/**
 * Ticket Verification & Public Lookups
 */
BookingRouter.get("/ticket-detail", getTicketDetails);
BookingRouter.get("/details", getTicketDetailsByPhone);
BookingRouter.get("/non-visited-users", nonVisitUser);

BookingRouter.put(
  "/ticket-verify",
  volunteerAuthMiddleware,
  accessMiddleware("admin", "volunteer"),
  verifyTicket,
);

/**
 * Admin Routes
 */
BookingRouter.get(
  "/",
  AuthMiddleware,
  accessMiddleware("admin", "volunteer"),
  getAllBookings,
);

BookingRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin", "volunteer"),
  getSingleBookingDetails,
);

export default BookingRouter;
