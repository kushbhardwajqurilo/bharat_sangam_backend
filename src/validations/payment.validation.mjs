import { z } from "zod";

export const getPaymentByIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payment ID format"),
});

export const getPaymentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => Math.max(1, Number.parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => Math.max(1, Number.parseInt(val, 10) || 10)),
  eventId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid event ID format")
    .optional(),
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format")
    .optional(),
  status: z
    .enum(["created", "attempted", "paid", "failed", "refunded"])
    .optional(),
  email: z.email("Invalid email format").optional(),
  phone: z
    .string()
    .regex(/^\d+$/, "Invalid phone number format")
    .transform(Number)
    .optional(),
  search: z.string().optional(),
});
