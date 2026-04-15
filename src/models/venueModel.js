import mongoose from "mongoose";
const venueSchema = new mongoose.Schema(
  {
    venue: { type: String, required: [true, "venue required"] },
    address: { type: String, required: [true, "venue required"] },
    image: { type: String, default: null },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);
venueSchema.index({ createdAt: -1 });
const venueModel = mongoose.model("venue", venueSchema);
export default venueModel;
