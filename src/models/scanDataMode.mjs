import mongoose from "mongoose";
const scanData = new mongoose.Schema(
  {
    ticketId: { type: String, required: [true, "ticket id required"] },
    scanAt: {
      type: Date,
      required: [true, "scac timing requried"],
    },
    scanBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "scan person requried"],
      ref: "volunteer",
    },
  },
  { timestamps: true },
);
scanData.index({ ticketId: 1, scanAt: 1, scanBy: 1 });
export const scanDataModel = mongoose.model("scandata", scanData);
