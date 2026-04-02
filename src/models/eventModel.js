import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
      index: true, //  search optimization
    },

    description: {
      type: String,
      required: true,
    },

    eventTiming: {
      startDate: {
        type: Date,
        required: true,
        index: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },

    instrument: {
      type: [String],
      default: [],
    },

    totalTickets: {
      type: Number,
      required: true,
      min: 1,
    },

    soldTickets: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

//  Virtual
eventSchema.virtual("availableTickets").get(function () {
  return this.totalTickets - this.soldTickets;
});

//  Compound index (for filtering)
eventSchema.index({ isActive: 1, "eventTiming.startDate": 1 });

const eventModel = mongoose.model("event", eventSchema);
export default eventModel;
