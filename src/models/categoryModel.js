import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: [true, "category name required"] },
    picture: { type: String, required: [true, "picture required"] },
    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);
categorySchema.index({ createdAt: -1 });
const categoryModel = mongoose.model("category", categorySchema);
export default categoryModel;
