import mongoose from "mongoose";

const eventGallerySchema = new mongoose.Schema(
  {
    date: { type: Date, required: [true, "date required"] },
    location: { type: String, required: [true, "location required"] },
    title: { type: String, required: [true, "title required"] },
    artistName: { type: String, required: [true, "artist name required"] },
    category: { type: String, required: [true, "category required"] },
    imageUrl: { type: String, required: [true, "imageUrl required"] },
    likes: {
      type: Number,
      required: [true, "likes required"],
      default: 0,
    },
    commentsCount: {
      type: Number,
      required: [true, "comments required"],
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

eventGallerySchema.index({ createdAt: -1 });
export const eventGalleryModel = mongoose.model(
  "eventgallery",
  eventGallerySchema,
);
