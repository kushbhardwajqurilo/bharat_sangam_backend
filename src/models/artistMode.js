import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    artistName: {
      type: String,
      required: [true, "Artist Name Required"],
      trim: true,
    },

    profileImage: {
      type: String,
      required: [true, "Artist Profile Image Required"],
    },

    about: {
      type: String,
      required: [true, "Artist bio required"],
    },

    email: {
      type: String,
      required: [true, "Artist email missing"],
      lowercase: true,
      trim: true,
    },

    contactNo: {
      type: String,
    },

    // performanceTime: {
    //   type: String,
    //   required: [true, "Performance time is required"],
    // },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    instruments: {
      type: [String],
      default: [],
    },

    galleryImages: [String],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const artistModel = mongoose.model("Artist", artistSchema);
export default artistModel;
