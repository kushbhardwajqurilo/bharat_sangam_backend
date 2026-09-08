import { z } from "zod";

export const createBookingOrderSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  mobile: z
    .string({ required_error: "Mobile number is required" })
    .trim()
    .regex(/^[0-9]{10}$/, "Mobile number must be a valid 10-digit number"),
  tickets: z
    .number({ required_error: "Tickets count is required" })
    .int("Tickets must be an integer")
    .min(1, "Minimum 1 ticket required")
    .max(10, "Maximum ticket limit per booking is 10"),
  ticketType: z
    .string({ required_error: "Ticket type is required" })
    .trim()
    .min(1, "Ticket type is required"),
  eventId: z
    .string({ required_error: "Event ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Event ID format"),
});

export const verifyAndCreateTicketSchema = z.object({
  razorpay_order_id: z
    .string({ required_error: "Razorpay Order ID is required" })
    .trim()
    .min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z
    .string({ required_error: "Razorpay Payment ID is required" })
    .trim()
    .min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z
    .string({ required_error: "Razorpay Signature is required" })
    .trim()
    .min(1, "Razorpay Signature is required"),
  reservationId: z
    .string({ required_error: "Reservation ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Reservation ID format"),
});
