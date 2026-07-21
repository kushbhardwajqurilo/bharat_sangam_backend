import highlightsModel from "../../models/highlightsModel/highlightsModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../../utils/handler.mjs"
import { deleteSingleVideoFromCloudinary } from "../../utils/videoUploader.mjs";

export const addHighlight = catchAsync(async (req, res, next) => {
    const { url, public_id, event } = req.body;
    const result = await highlightsModel.create({ url, public_id, event });
    if (!result) {
        return next(new AppError("Failed to Upload", 400));
    }
    return sendSuccess(res, "success", {}, 200, true)
})

export const getAllHighlights = catchAsync(async (req, res, next) => {
    const result = await highlightsModel.find({}).select("-__v -createdAt -updatedAt").sort({ createdAt: -1 }).limit(10).lean();
    if (!result) {
        return next(new AppError("Highlights not found or not available"));
    }
    return sendSuccess(res, "success", result, 200, true);
})

export const deleteSingleHighlight = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const highlight = await highlightsModel.findByIdAndDelete(id);
    if (!highlight || highlight == null) {
        return next(new AppError("Highlight Not Found", 404))
    }
    const result = await deleteSingleVideoFromCloudinary(highlight.public_id);
    if (!result) {
        return next(new AppError("Failed to Delete from Cloudinary", 400))
    }
    return sendSuccess(res, "success", {}, 200, true);
})

