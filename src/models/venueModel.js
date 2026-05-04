import mongoose from "mongoose";
const venueSchema = new mongoose.Schema(
  {
    city: { type: String, required: [true, "city required"] },
    venue: { type: String, required: [true, "venue required"] },
    address: { type: String, required: [true, "venue required"] },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
venueSchema.index({ createdAt: -1 });
const venueModel = mongoose.model("venue", venueSchema);
export default venueModel;
