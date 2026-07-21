import { Testimonial } from "../../models/testimonialModel/testimonial.model.mjs";
import { AppError, catchAsync, sendSuccess } from "../../utils/handler.mjs";
import { deleteSingleVideoFromCloudinary } from "../../utils/videoUploader.mjs";

export const addTestimonialRequest = catchAsync(async (req, res, next) => {
    const { url, public_id, event } = req?.body;
    const result = await Testimonial.create({ url, public_id, event });
    if (!result) {
        return next(new AppError("Failed to add testimonial", 400))
    }
    return sendSuccess(res, "success", {}, 200, true)
})

export const getAllTestimonials = catchAsync(async (req, res, next) => {
    const testimonial = await Testimonial.find({}).sort({ createdAt: -1 }).select("-__v -createdAt -updatedAt").limit(10).lean();
    if (!testimonial) {
        return next(new AppError("No testimonials found", 404))
    }
    return sendSuccess(res, "success", testimonial, 200, true);
})
export const deleteSingleTestimonial = catchAsync(async (req, res, next) => {
    const { id } = req?.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial || testimonial == null) {
        return next(new AppError("Testionial not found", 400))
    }
    const result = await deleteSingleVideoFromCloudinary(testimonial?.public_id);
    if (!result) {
        return next(new AppError("Failed to Delete from Cloudinary", 400))
    }
    return sendSuccess(res, "success", {}, 200, true);
})