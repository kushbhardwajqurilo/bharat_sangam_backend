import mongoose from "mongoose";

const herosectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "hero-section",
      unique: true,
      immutable: true,
    },

    videoUrl: { type: String, required: [true, "URL Required"] },
  },
  {
    timestamps: true,
  },
);

const heroSectionModel = mongoose.model("heresectionvideo", herosectionSchema);
export default heroSectionModel;
