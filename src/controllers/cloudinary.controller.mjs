import crypto from "crypto";
import { catchAsync, sendSuccess } from "../utils/handler.mjs";

export const getSignature = catchAsync(async (req, res, next) => {
  const timestamps = Math.floor(Date.now() / 1000);
  const params = `folder=uploads&bharatsangam&timesamp=${timestamps}`;
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
  });
});
