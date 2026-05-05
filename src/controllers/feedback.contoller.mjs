import feedbackModel from "../models/feedbackModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const feedbackController = catchAsync(async (req, res, next) => {
  const requiredFields = ["fullName", "email", "message"];

  //  FIXED validation
  const missingField = requiredFields.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingField) {
    return next(new AppError(`${missingField} missing`, 400));
  }

  let { fullName, email, message, rating } = req.body;

  // Normalize FIRST
  email = email.toLowerCase().trim();
  fullName = fullName.trim();
  message = message.trim();

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid Email Format", 400));
  }
  if (!email.endsWith("@gmail.com")) {
    return next(new AppError("Invaid Email Try again", 400));
  }
  try {
    //  Pre-check (good UX, but not main protection)
    const existing = await feedbackModel.findOne({ email });
    if (existing) {
      return next(new AppError("Feedback already given", 400));
    }

    //  Create (DB unique index is final protection)
    await feedbackModel.create({
      fullName,
      email,
      message,
      rating,
    });

    return sendSuccess(res, "Feedback Successfully", {}, 201, true);
  } catch (error) {
    //  FINAL protection (must have)
    if (error.code === 11000) {
      return next(new AppError("Feedback already given", 400));
    }
    return next(error);
  }
});

// get all feedback
export const getAllFeedbacks = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 5 } = req.query;
  const { search } = req?.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;
  let pipeline = [];
  if (search && search?.trim() !== "") {
    pipeline.push({
      $match: {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
          { avgRating: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // main aggregate
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        _id: 1,
        name: "$fullName",
        rating: "$avgRating",
        email: 1,
        feedback: "$message",
      },
    },
  );
  let countQuery = {};
  if (search && search?.trim() !== "") {
    countQuery = {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        ...(isNaN(search) ? [] : [{ avgRating: Number(search) }]),
      ],
    };
  }
  const [Feedbacks, total] = await Promise.all([
    feedbackModel.aggregate(pipeline),
    feedbackModel.countDocuments(countQuery),
  ]);

  return sendSuccess(
    res,
    "success",
    {
      data: Feedbacks,
      pagination: {
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    },
    200,
    true,
  );
});
