import mongoose from "mongoose";

const influencerSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
            required: true,
        },

        lastName: {
            type: String,
            trim: true,
            required: true,
        },

        fullName: {
            type: String,
            trim: true,
        },

        phone: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other", "N/A"],
        },

        address: {
            city: {
                type: String,
                trim: true,
                default: "N/A"
            },
            state: {
                type: String,
                trim: true,
                default: "N/A"
            },
            pincode: {
                type: Number,
                trim: true,
                default: 0
            },
        },

        profilePicture: {
            type: String,
            default: "_blank.png",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        }
    },
    {
        timestamps: true,
    }
);

/**
 * Automatically generate fullName
 */
influencerSchema.pre("save", function (next) {
    this.fullName = `${this.firstName || ""} ${this.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim();

    next();
});

influencerSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();

    if (update.firstName || update.lastName) {
        const firstName = update.firstName ?? "";
        const lastName = update.lastName ?? "";

        update.fullName = `${firstName} ${lastName}`
            .replace(/\s+/g, " ")
            .trim();

        this.setUpdate(update);
    }

    next();
});

// Unique indexes
influencerSchema.index({ email: 1 }, { unique: true, sparse: true });
influencerSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Full name search
influencerSchema.index({ fullName: 1 });

// First + Last name search
influencerSchema.index({ firstName: 1, lastName: 1 });

// Location filter
influencerSchema.index({
    "address.state": 1,
    "address.city": 1,
});

// Gender filter
influencerSchema.index({ gender: 1 });

// Latest influencers
influencerSchema.index({ createdAt: -1 });

// Combined email & phone lookup
influencerSchema.index({ email: 1, phone: 1 });

// Full-text search
influencerSchema.index({
    fullName: "text",
    email: "text",
    "address.city": "text",
    "address.state": "text",
});

const InfluencerModel = mongoose.model("Influencer", influencerSchema);

export default InfluencerModel;