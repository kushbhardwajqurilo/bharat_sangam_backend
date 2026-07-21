import mongoose from "mongoose";

const highlightsSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: [true, "Event Required"] },
    url: { type: String, default: null },
    public_id: { type: String, required: [true, "Highlight Public Id Required"] }
}, { timestamps: true });

highlightsSchema.index({ event: 1 });
highlightsSchema.index({ createdAt: -1 });

const highlightsModel = mongoose.model("Highlight", highlightsSchema);
export default highlightsModel;