import mongoose from "mongoose";


const couponSchema = new mongoose.Schema({
    coupon: { type: String, required: true },
    discount: { type: Number, required: true },
    description: {
        type: String,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    // For admin to track who created it
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

export default mongoose.model('Coupon', couponSchema);