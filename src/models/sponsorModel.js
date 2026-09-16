import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [30, "Full name cannot exceed 30 characters"],
    },

    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [50, "Company name cannot exceed 50 characters"],
    },

    designation: {
      type: String,
      trim: true,
      maxlength: [50, "Designation cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [100, "Email cannot exceed 100 characters"],
    },

    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      maxlength: [15, "Phone cannot exceed 15 characters"],
    },

    websiteOrInstagram: {
      type: String,
      trim: true,
      maxlength: [200, "Website or Instagram cannot exceed 200 characters"],
    },

    sponsorshipInterest: {
      type: String,
      trim: true,
      maxlength: [100, "Sponsorship interest cannot exceed 100 characters"],
    },

    estimatedBudgetRange: {
      type: String,
      trim: true,
      maxlength: [50, "Budget range cannot exceed 50 characters"],
    },

    productServiceContribution: {
      type: String,
      trim: true,
      maxlength: [500, "Contribution cannot exceed 500 characters"],
    },

    additionalMessage: {
      type: String,
      trim: true,
      maxlength: [1000, "Additional message cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

sponsorSchema.index({ createdAt: -1 });
sponsorSchema.index({ email: 1 });
sponsorSchema.index({ phone: 1 });
sponsorSchema.index({ companyName: 1 });
sponsorSchema.index({ fullName: 1 });

const sponsorModel = mongoose.model("sponsor", sponsorSchema);

export default sponsorModel;
