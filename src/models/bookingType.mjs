import mongoose from "mongoose";
const bookingType = new mongoose.Schema(
  {
    bookingType: {
      type: String,
      required: [true, "booking type required"],
      trim: true,
    },
    price: { type: Number, required: [true, "price required"], min: 0 },
    isDelete: { type: Boolean, default: false },
    subtitle: {
      type: String,
      trim: true,
      default: "General Entry",
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);
bookingType.index({ createdAt: -1 });
bookingType.index({ subtitle: -1 });
const bookingTypeModel = mongoose.model("bokkingType", bookingType);
export default bookingTypeModel;
