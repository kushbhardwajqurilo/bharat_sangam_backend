import mongoose from "mongoose";

const artistRequestSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, lowercase: true, required: true },
    lastName: { type: String, trim: true, lowercase: true, required: true },
    fullName: { type: String, trim: true },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      required: true,
    },
    gender: { type: String, trim: true, enum: ["male", "female", "other"] },
    profilePicture: { type: String, default: "_black.png" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    socialLinks: {
      instagram: {
        type: String,
        trim: true,
        default: "N/A",
      },

      facebook: {
        type: String,
        trim: true,
        default: "N/A",
      },

      youtube: {
        type: String,
        trim: true,
        default: "N/A",
      },
    },
  },
  { timestamps: true },
);

artistRequestSchema.pre("save", function (next) {
  this.fullName = `${this.firstName || ""} ${this.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();

  next();
});
artistRequestSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  update.fullName = `${update.firstName || ""} ${update.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();
  this.setUpdate(update);
  next();
});
artistRequestSchema.index({ email: 1 }, { unique: true, sparse: true });
artistRequestSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Full name search
artistRequestSchema.index({ fullName: 1 });

// First + Last name search
artistRequestSchema.index({ firstName: 1, lastName: 1 });
// Gender filter
artistRequestSchema.index({ gender: 1 });

// Latest request
artistRequestSchema.index({ createdAt: -1 });

// Combined email & phone lookup
artistRequestSchema.index({ email: 1, phone: 1 });

// Full-text search
artistRequestSchema.index({
  fullName: "text",
  email: "text",
});
const ArtistRequestModel = mongoose.model("ArtistRequest", artistRequestSchema);
export default ArtistRequestModel;
