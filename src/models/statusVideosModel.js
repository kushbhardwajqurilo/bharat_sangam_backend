import mongoose from "mongoose";

const statusVideoSchema = new mongoose.Schema(
  {
    tags: { type: [String], required: true },
    videoUrl: { type: String, required: [true, "Video URL Required"] },
    thumbnailUrl: { type: String, required: [true, "Thumbnail URL Required"] },
    downloadsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
statusVideoSchema.index({ createdAt: -1 });

statusVideoSchema.index({
  downloadCount: -1,
  createdAt: -1,
});

statusVideoSchema.index({
  tags: 1,
  createdAt: -1,
});
const statusVideosModel = mongoose.model("statusvideo", statusVideoSchema);
export default statusVideosModel;
