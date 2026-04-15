import contactModel from "../models/contactModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const contactController = catchAsync(async (req, res, next) => {
  const requiredFields = ["fullName", "email", "phone", "query"];
  const missingField = requiredFields.find(
    (field) => !req.body || req.body.toString().trim().length === "",
  );

  if (missingField) {
    return next(new AppError(`${missingField} missing`));
  }
  const { fullName, email, phone, query } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid Email Format", 400));
  }
  const payload = {
    fullName: fullName.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    phone: phone.toLowerCase().trim(),
    query: query.toLowerCase().trim(),
  };
  const result = await contactModel.create(payload);
  if (!result) {
    return next(new AppError("failed to sumbit", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});
