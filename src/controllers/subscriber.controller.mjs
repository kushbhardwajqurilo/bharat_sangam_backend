import subscriberModel from "../models/subscriberModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const addSubscribers = catchAsync(async (req, res, next) => {
  let { email } = req.body;
  console.log("body", req.body);
  // Check required
  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  //  Normalize email
  email = email.trim().toLowerCase();

  //  Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid email format", 400));
  }
  if (!email.endsWith("@gmail.com")) {
    return next(new AppError("Invalid Email", 400));
  }
  try {
    //  Single DB call (no findOne)
    const subscriber = await subscriberModel.create({ email });

    return sendSuccess(res, "Subscribed successfully", {}, 201, true);
  } catch (error) {
    //  Handle duplicate email (unique index)
    if (error.code === 11000) {
      return next(new AppError("Email already subscribed", 400));
    }

    return next(error);
  }
});
