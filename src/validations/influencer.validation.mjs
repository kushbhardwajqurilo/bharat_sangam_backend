import mongoose from "mongoose";
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

export const getAllRequestQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(25).positive().default(10),
    search: z.string().trim().optional(),
});

export const influencerParamsSchema = z.object({
    id: z.string().refine(mongoose.Types.ObjectId.isValid, "Invalid influencer ID")
});
export const multipleInfluencerDeleteSchema = z.object({
    ids: z
        .array(
            z.string().refine(
                (id) => mongoose.Types.ObjectId.isValid(id),
                {
                    message: "Invalid ObjectId",
                }
            )
        )
        .min(1, "At least one influencer ID is required")
        .max(100, "Maximum 100 IDs are allowed"),
});

// influencer status update request

export const influencerStatusSchema = z.object({
    id: z.string().trim().refine(mongoose.Types.ObjectId.isValid, "Invalid influencer ID"),

    status: z.string().trim().toLowerCase().min(1, "Status requrired").refine((value) => ["approved", "rejected"].includes(value), {
        message: "Invalid Status"
    })
});