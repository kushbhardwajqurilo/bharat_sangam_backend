import mongoose, { Schema } from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, " category is required"],
        trim: true,
        ref: "category",
      },
    ],
    description: {
      type: String,
      default: "",
    },
    venueName: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Venue name is required"],
      trim: true,
      ref: "venue",
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
    },

    startTime: {
      type: String, // you can also use Date if combining date+time
      required: [true, "Event time is required"],
    },
    endTime: {
      type: String, // you can also use Date if combining date+time
      required: [true, "Event time is required"],
    },

    tabs: [
      {
        type: String, // e.g. Singer, Guitar, Tabla
        trim: true,
      },
    ],

    hashTags: [String],

    bookingType: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "booking",
        required: [true, "Booking type is required"],
      },
    ],
    sponsors: [
      {
        type: String, // OR you can make separate Sponsor model later
        trim: true,
        ref: "sponsor",
        default: null,
      },
    ],

    artists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "artist", // link with your artistModel
      },
    ],

    homeBanner: {
      type: String,
      default: "",
    },

    eventBanner: {
      type: String,
      default: "",
    },

    maxSeats: {
      type: Number,
      default: 100,
    },

    bookedSeats: {
      type: Number,
      default: 0,
    },
    availableTickets: {
      type: Number,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ogImage: {
      type: String,
      default:
        "https://res.cloudinary.com/dqwc7j44b/image/upload/v1776320688/bharat_bhakti_sangam_banner_for_website.png0_tfl5fb.png",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Event", eventSchema);
