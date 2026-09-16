import z from "zod";

export const highlightsSchema = z.object({
  title: z.string().trim(),
  reviewerName: z.string().trim().optional(),
  location: z.string().trim(),
  rating: z.number(),
  highlightVideoSrc: z.url("Invalid URL"),
  posterSrc: z.string().trim().optional(),
  videoSrc: z.url("Invalid URL"),
});
export const updateHighlightsSchema = z.object({
  title: z.string().trim().optional(),
  reviewerName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  rating: z.number().optional(),
  highlightVideoSrc: z.url("Invalid URL").optional(),
  posterSrc: z.string().trim().optional(),
  videoSrc: z.url("Invalid URL").optional(),
});

export const heroSectionSchema = z.object({
  videoUrl: z.url("Invalid URL"),
});

// CAPTURE MEMORIES SCHEMA START

export const eventGalleyScheam = z.object({
  date: z.string(),
  location: z.string(),
  title: z.string().trim(),
  artistName: z.string().trim(),
  category: z.string().trim(),
  imageUrl: z.url("Invalid URL"),
  likes: z.number(),
  commentsCount: z.number(),
});

export const updateEventGallerySchema = z.object({
  date: z.string().optional(),
  location: z.string().optional(),
  title: z.string().trim().optional(),
  artistName: z.string().trim().optional(),
  category: z.string().trim().optional(),
  imageUrl: z.url("Invalid URL").optional(),
  likes: z.number().optional(),
  commentsCount: z.number().optional(),
});

// CAPTURE MEMORIES SCHEMA END
