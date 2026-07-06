import { z } from "zod"
export const artistRequestSchema = z.object({
    firstName: z.string().trim().min(1, "firstName required").max(25, "first name cannot exceed 25 characters"),
    lastName: z.string().trim().min(1, "last name required").max(25, "last name cannot exceed 25 characters"),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, "invalid phone number"),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .max(100),
    gender: z
        .enum(["male", "female", "other"])
        .optional(),
    profilePicture: z.string().optional(),
})