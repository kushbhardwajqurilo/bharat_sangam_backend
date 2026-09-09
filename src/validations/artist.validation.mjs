import mongoose from "mongoose";
import { z } from "zod";

export const artistCreateSchema = z.object({
  artistName: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  role: z.string().trim().optional().default("Artist"),
  aboutArtist: z.string().trim().optional(),
  about: z.string().trim().optional(),
  profileImage: z.string().trim().optional(),
  profilePicture: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(100),
  contactNo: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  gender: z.enum(["male", "female", "other"]).default("other").optional(),
  address: z
    .object({
      city: z.string().trim().optional().default(""),
      state: z.string().trim().optional().default(""),
      pincode: z.string().trim().optional().default(""),
    })
    .optional()
    .default({}),
  socialLinks: z
    .object({
      instagram: z.string().trim().optional().default(""),
      youtube: z.string().trim().optional().default(""),
      facebook: z.string().trim().optional().default(""),
    })
    .optional()
    .default({}),
  instruments: z.array(z.string().trim()).optional().default([]),
  startTime: z.string().trim().optional().default(""),
  endTime: z.string().trim().optional().default(""),
  galleryImages: z.array(z.string().trim()).optional().default([]),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  isActive: z.boolean().optional().default(true),
});

export const artistUpdateSchema = z.object({
  artistName: z.string().trim().optional(),
  role: z.string().trim().optional(),
  aboutArtist: z.string().trim().optional(),
  about: z.string().trim().optional(),
  profileImage: z.string().trim().optional(),
  profilePicture: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  contactNo: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z
    .object({
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      pincode: z.string().trim().optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      instagram: z.string().trim().optional(),
      youtube: z.string().trim().optional(),
      facebook: z.string().trim().optional(),
    })
    .optional(),
  instruments: z.array(z.string().trim()).optional(),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  galleryImages: z.array(z.string().trim()).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  isActive: z.boolean().optional(),
});

export const artistStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"], {
    errorMap: () => ({ message: "Status must be 'pending', 'approved', or 'rejected'" }),
  }),
});

export const artistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).positive().default(10),
  search: z.string().trim().optional(),
  status: z.enum(["all", "pending", "approved", "rejected"]).optional().default("all"),
  sortBy: z.string().trim().optional().default("createdAt"),
  order: z.enum(["asc", "desc", "1", "-1"]).optional().default("desc"),
});

export const artistParamsSchema = z.object({
  id: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "Invalid Artist ID",
  }),
});

// Backward compatibility alias for legacy artist request validation
export const artistRequestSchema = artistCreateSchema;
