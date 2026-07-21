import mongoose from "mongoose";


const testimonialSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Event is required"],
        ref: "Event"
    },
    url: { type: String, required: [true, "Video url required"] },
    public_id: { type: String, required: [true, "Public id required"] },
}, { timestamps: true });
testimonialSchema.index({ createdAt: -1 });
testimonialSchema.index({ event: 1 });
export const Testimonial = mongoose.model("Testimonial", testimonialSchema);