import z from "zod";

export const sponsorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(30, "Full name cannot exceed 30 characters"),

  companyName: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(50, "Brand name cannot exceed 50 characters"),

  designation: z
    .string()
    .trim()
    .max(50, "Designation cannot exceed 50 characters")
    .optional(),

  email: z.string().trim().email("Please enter a valid email"),

  phone: z
    .string()
    .trim()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d{10}$/, "Phone number must contain only digits"),

  websiteOrInstagram: z
    .string()
    .trim()
    .url("Please enter a valid URL")
    .optional(),

  sponsorshipInterest: z
    .string()
    .trim()
    .max(200, "Sponsorship interest cannot exceed 200 characters")
    .optional(),

  estimatedBudgetRange: z.coerce.string().optional(),

  productServiceContribution: z
    .string()
    .trim()
    .max(500, "Product/service contribution cannot exceed 500 characters")
    .optional(),

  additionalMessage: z
    .string()
    .trim()
    .max(1000, "Additional message cannot exceed 1000 characters")
    .optional(),
});
