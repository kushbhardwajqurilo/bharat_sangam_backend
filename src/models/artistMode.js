import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    artistName: {
      type: String,
      required: [true, "Artist Name Required"],
      trim: true,
    },

    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      default: "Artist",
    },

    aboutArtist: {
      type: String,
      required: [true, "Artist bio is required"],
      trim: true,
    },

    profileImage: {
      type: String,
      required: [true, "Artist Profile Image Required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Artist email missing"],
      lowercase: true,
      trim: true,
    },

    contactNo: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    address: {
      city: {
        type: String,
        trim: true,
        default: "",
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      pincode: {
        type: String,
        trim: true,
        default: "",
      },
    },

    socialLinks: {
      instagram: {
        type: String,
        trim: true,
        default: "",
      },
      youtube: {
        type: String,
        trim: true,
        default: "",
      },
      facebook: {
        type: String,
        trim: true,
        default: "",
      },
    },

    instruments: {
      type: [String],
      default: [],
    },

    startTime: {
      type: String,
      trim: true,
      default: "",
    },

    endTime: {
      type: String,
      trim: true,
      default: "",
    },

    galleryImages: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual alias for legacy `about` field
artistSchema.virtual("about").get(function () {
  return this.aboutArtist;
});

// Indexes for fast searching and filtering
artistSchema.index({ artistName: 1 });
artistSchema.index({ email: 1 });
artistSchema.index({ contactNo: 1 });
artistSchema.index({ status: 1 });
artistSchema.index({ isActive: 1 });
artistSchema.index({ status: 1, isActive: 1 });
artistSchema.index({ createdAt: -1 });
artistSchema.index({
  artistName: "text",
  role: "text",
  email: "text",
  contactNo: "text",
});

const artistModel = mongoose.model("Artist", artistSchema);
export default artistModel;
