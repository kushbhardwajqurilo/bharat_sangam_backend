import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,

      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },

    source: {
      type: String,
      default: "website",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

subscriberSchema.index({ email: 1 }, { unique: true });

const subscriberModel = mongoose.model("subscriber", subscriberSchema);

export default subscriberModel;
