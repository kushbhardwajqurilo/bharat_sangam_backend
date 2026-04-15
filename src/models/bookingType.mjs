import mongoose from "mongoose";
const bookingType = new mongoose.Schema(
  {
    bookingType: {
      type: String,
      required: [true, "booking type required"],
    },
    price: { type: Number, required: [true, "price required"] },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);
bookingType.index({ createdAt: -1 });
const bookingTypeModel = mongoose.model("bokkingType", bookingType);
export default bookingTypeModel;
