import z from "zod";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().refine((val) => objectIdRegex.test(val), {
  message: "Invalid ObjectId format",
});
export const statusVideoSchema = z.object({
  tags: z
    .array(z.string().trim().min(1, "At least 1 tag required"))
    .min(1, "At least 1 tag required"),
  videoUrl: z.url(),
  thumbnailUrl: z.url().optional(),
});
// export const videoSchema = z.object({
//   tags: z.array(z.string()).min(1, "At least 1 tag required"),
//   url: z.url().refine(
//       (url) => /\.(mp4|webm|mov|mkv)$/i.test(new URL(url).pathname),
//       "URL must be a valid video URL"
//     )
// });

export const getAllStatusVideoSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),

  search: z.string().trim().optional(),

  tag: z.string().trim().optional(),

  sortBy: z
    .enum(["latest", "popular", "downloads", "oldest"])
    .optional()
    .default("latest"),

  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const updateStatudVideoSchema = z.object({
  tags: z
    .array(z.string().trim().min(1, "At least 1 tag required"))
    .min(1, "At least 1 tag required"),
  videoUrl: z.url(),
  thumbnailUrl: z.url(),
});
