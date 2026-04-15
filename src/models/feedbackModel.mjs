import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      food: {
        type: Number,
        min: 1,
        max: 5,
        default: 4,
      },
      management: {
        type: Number,
        min: 1,
        max: 5,
        default: 4,
      },
      crowd: {
        type: Number,
        min: 1,
        max: 5,
        default: 4,
      },
    },

    //  calculated field (important)
    avgRating: {
      type: Number,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, "full name required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "email required"],
      lowercase: true,
      trim: true,
    },

    message: {
      type: String,
      required: [true, "message required"],
      trim: true,
    },
  },
  { timestamps: true },
);

//  Auto calculate avg rating before save
feedbackSchema.pre("save", function (next) {
  const { food, management, crowd } = this.rating;

  this.avgRating = Number(((food + management + crowd) / 3).toFixed(1));

  next();
});

//  Main index → best rating + latest first
feedbackSchema.index({ avgRating: -1, createdAt: -1 });

// (Optional) latest only index
feedbackSchema.index({ createdAt: -1 });

const feedbackModel = mongoose.model("feedback", feedbackSchema);

export default feedbackModel;
