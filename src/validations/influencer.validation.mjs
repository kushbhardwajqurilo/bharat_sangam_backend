import { z } from "zod";

export const influencerSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(4, "First name is required")
        .max(40, "First name cannot exceed 40 characters"),

    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required")
        .max(40, "Last name cannot exceed 40 characters"),

    phone: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .max(100),

    gender: z
        .enum(["male", "female", "other"])
        .optional(),

    profilePicture: z
        .string()
        .optional(),

    address: z
        .object({
            city: z
                .string()
                .trim()
                .max(25)
                .optional(),

            state: z
                .string()
                .trim()
                .max(25)
                .optional(),

            pincode: z
                .string()
                .regex(/^\d{6}$/, "Invalid pincode")
                .optional(),
        })
        .optional(),
});