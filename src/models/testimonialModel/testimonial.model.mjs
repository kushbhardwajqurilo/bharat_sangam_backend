import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title required"],
    },
    reviewerName: {
      type: String,
    },
    location: {
      type: String,
      required: [true, "location required"],
    },
    highlightVideoSrc: {
      type: String,
      required: [true, "highlight video source required"],
    },
    rating: {
      type: Number,
      required: [true, "rating required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },
    posterSrc: {
      type: String,
    },
    videoSrc: {
      type: String,
      required: [true, "video src required"],
    },
  },
  { timestamps: true },
);
testimonialSchema.index({ createdAt: -1 });
export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
