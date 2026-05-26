import express from "express";
import {
  createTicket,
  getAllBookings,
  getSingleBookingDetails,
  getTicketDetails,
  getTicketDetailsByPhone,
  nonVisitUser,
  // reserveTickets,
  verifyTicket,
  //   generateTicketImage,
} from "../controllers/booking.controller.mjs";
import { get } from "mongoose";
import { getSingleBookingType } from "../controllers/admin.controller.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
  volunteerAuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
const BookingRouter = express.Router();
// BookingRouter.post("/reservations", reserveTickets);
BookingRouter.post("/create-ticket", createTicket);
BookingRouter.get("/ticket-detail", getTicketDetails);
BookingRouter.get("/details", getTicketDetailsByPhone);
BookingRouter.get("/non-visited-users", nonVisitUser);
BookingRouter.put(
  "/ticket-verify",
  volunteerAuthMiddleware,
  accessMiddleware("admin", "volunteer"),
  verifyTicket,
);
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
