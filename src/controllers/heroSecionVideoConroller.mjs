import heroSectionModel from "../models/heroSectionModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const addAndUpdateHeroSectionController = catchAsync(
  async (req, res, next) => {
    const { videoUrl } = req.body;
    const result = await heroSectionModel.findOneAndUpdate(
      { key: "hero-section" },
      { $set: { videoUrl } },
      { upsert: true, runValidators: true, new: true },
    );

    if (!result) {
      return next(new AppError("Unable to add/update hero section", 400));
    }

    return sendSuccess(res, "Hero section updated successfully", {}, 201, true);
  },
);

export const getHeroSectionController = catchAsync(async (req, res, next) => {
  const result = await heroSectionModel
    .findOne({ key: "hero-section" })
    .select("videoUrl");
  return sendSuccess(res, "success", result, 200, true);
});
