import { Testimonial } from "../../models/testimonialModel/testimonial.model.mjs";
import { AppError, catchAsync, sendSuccess } from "../../utils/handler.mjs";
import { deleteSingleVideoFromCloudinary } from "../../utils/videoUploader.mjs";

export const addTestimonialRequest = catchAsync(async (req, res, next) => {
  const {
    title,
    reviewerName,
    location,
    rating,
    highlightVideoSrc,
    posterSrc,
    videoSrc,
  } = req?.body;
  const result = await Testimonial.create({
    title,
    reviewerName,
    location,
    rating,
    highlightVideoSrc,
    posterSrc,
    videoSrc,
  });
  if (!result) {
    return next(new AppError("Failed to add testimonial", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

export const getAllTestimonials = catchAsync(async (req, res, next) => {
  const testimonial = await Testimonial.find({})
    .sort({ createdAt: -1 })
    .select("-__v -createdAt -updatedAt")
    .limit(10)
    .lean();
  if (!testimonial) {
    return next(new AppError("No testimonials found", 404));
  }
  return sendSuccess(res, "success", testimonial, 200, true);
});
export const deleteSingleTestimonial = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const testimonial = await Testimonial.findById(id).select(
    "highlightVideoSrc posterSrc videoSrc",
  );

  if (!testimonial) {
    return next(new AppError("Testimonial not found", 404));
  }

  const getPublicId = (url) => {
    if (!url) return null;

    const uploadsIndex = url.indexOf("uploads");

    if (uploadsIndex === -1) return null;

    return url.substring(uploadsIndex).replace(/\.[^/.]+$/, "");
  };

  // Delete highlight video
  if (testimonial.highlightVideoSrc) {
    const publicId = getPublicId(testimonial.highlightVideoSrc);

    if (publicId) {
      await deleteSingleVideoFromCloudinary(publicId, "video");
    }
  }

  // Delete main video
  if (testimonial.videoSrc) {
    const publicId = getPublicId(testimonial.videoSrc);

    if (publicId) {
      await deleteSingleVideoFromCloudinary(publicId, "video");
    }
  }

  // Delete poster
  if (testimonial.posterSrc) {
    const publicId = getPublicId(testimonial.posterSrc);

    if (publicId) {
      await deleteSingleVideoFromCloudinary(publicId, "image");
    }
  }

  // Delete from MongoDB
  await Testimonial.findByIdAndDelete(id);

  return sendSuccess(res, "Testimonial deleted successfully", null, 200, true);
});

export const updateTestimonial = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const payload = { ...req.body };
  const result = await Testimonial.findByIdAndUpdate(
    id,
    { $set: payload },
    { runValidators: true, new: true },
  );
  if (!result) {
    return next(new AppError("Unable to update Testimonial", 400));
  }
  return sendSuccess(res, "success", {}, 201, true);
});
