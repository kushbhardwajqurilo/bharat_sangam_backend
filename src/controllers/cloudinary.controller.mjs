import crypto from "crypto";
import { catchAsync, sendSuccess } from "../utils/handler.mjs";
import cloudinaryConfig from "../config/cloudinary.mjs";

export const getSignature = catchAsync(async (req, res, next) => {
  const timestamps = Math.floor(Date.now() / 1000);
  const params = `folder=uploads&return_delete_token=true&timestamp=${timestamps}`;
  const signature = crypto
    .createHash("sha1")
    .update(params + process.env.CLOUD_SECRET)
    .digest("hex");

  //  for  forntend `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`
  return sendSuccess(res, "success", {
    timestamps,
    signature,
    apiKey: process.env.CLOUD_KEY,
    cloudName: process.env.CLOUD_NAME,
    folder: "uploads",
    returnDeleteToken: true,
  });
});
export const deleteFromClodinary = catchAsync(async (req, res, next) => {
  const { public_id } = req.body;

  if (!public_id) {
    return next(new AppError("Public id missing", 400));
  }

  const result = await cloudinaryConfig.uploader.destroy(public_id);

  if (result.result !== "ok") {
    return next(new AppError(`Failed to delete file: ${result.result}`, 400));
  }

  return sendSuccess(res, "File deleted successfully", {}, 200, true);
});
