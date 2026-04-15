import feedbackModel from "../models/feedbackModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const feedbackController = catchAsync(async (req, res, next) => {
  const requiredFields = ["fullName", "email", "message"];
  const missingField = requiredFields.find(
    (field) => !req.body || req.body.toString().trim() === "",
  );
  if (missingField) {
    return next(new AppError(`${missingField} missing`));
  }
  const { fullName, email, message, rating } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid Email Format", 400));
  }
  const payload = {
    fullName: fullName.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    message: message.toLowerCase().trim(),
    rating,
  };
  const result = await feedbackModel.create(payload);
  if (!result) {
    return next(new AppError("feedback failed try again", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

// get all
