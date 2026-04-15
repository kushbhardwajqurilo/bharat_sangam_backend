import express from "express";
import {
  createTicket,
  getTicketDetails,
  verifyTicket,
  //   generateTicketImage,
} from "../controllers/booking.controller.mjs";
import { get } from "mongoose";
import { getSingleBookingType } from "../controllers/admin.controller.mjs";
import {
  accessMiddleware,
  volunteerAuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
const BookingRouter = express.Router();
BookingRouter.post("/create-ticket", createTicket);
BookingRouter.get("/ticket-detail", getTicketDetails);
BookingRouter.put(
  "/ticket-verify",
  volunteerAuthMiddleware,
  accessMiddleware("admin", "volunteer"),
  verifyTicket,
);

export default BookingRouter;
