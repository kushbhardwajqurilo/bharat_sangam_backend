import mongoose from "mongoose";
import calendarModel from "../models/calender.model.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const addCalendarEntry = catchAsync(async (req, res, next) => {
  const requiredField = ["festival", "date", "month", "day", "image"];
  const missingFields = requiredField.find(
    (feild) => !req.body[feild] || req.body[feild].toString().trim() === "",
  );
  if (missingFields) {
    return next(new AppError(`${missingFields} missing`, 400));
  }
  const { festival, date, month, day, image } = req.body;
  const result = await calendarModel.create({
    festival,
    date,
    month,
    day,
    image,
  });
  if (!result) {
    return next(new AppError("failed to add calendar entry", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

export const getAllCalendarEntry = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  const { search } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  let pipeline = [];

  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { festival: { $regex: search, $options: "i" } },
          { date: { $regex: search, $options: "i" } },
          { day: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        id: 1,
        festival: 1,
        date: 1,
        image: 1,
        month: 1,
        day: 1,
      },
    },
  );

  let countQuery = {};

  if (search && search.trim() !== "") {
    countQuery = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { festival: { $regex: search, $options: "i" } },
        { date: { $regex: search, $options: "i" } },
        { day: { $regex: search, $options: "i" } },
      ],
    };
  }

  const [result, total] = await Promise.all([
    calendarModel.aggregate(pipeline),
    calendarModel.countDocuments(countQuery),
  ]);

  return sendSuccess(
    res,
    "success",
    {
      data: result,
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

// get single festival entry
export const getSingleFestivalEntry = catchAsync(async (req, res, nex) => {
  const { id } = req?.params;
  if (!id) return next(new AppError("festival id missing", 400));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("Invalid Festival Id", 400));

  const result = await calendarModel.findOne(
    { _id: id },
    "id festival date day month image",
  );
  if (!result) {
    return next(new AppError("festival not found", 400));
  }
  return sendSuccess(res, "success", result, 200, true);
});

export const updateCalenderEntry = catchAsync(async (req, res, next) => {
  const requiredField = ["festival", "date", "month", "day", "image"];

  const missingFields = requiredField.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingFields) {
    return next(new AppError(`${missingFields} missing`, 400));
  }

  const { festival, date, month, day, image } = req.body;
  const { id } = req.params;

  if (!id) {
    return next(new AppError("Festival id missing", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Festival Id", 400));
  }

  const payload = {
    festival,
    date,
    month,
    day,
    image,
  };

  const result = await calendarModel.updateOne({ _id: id }, { $set: payload });

  // if no document found
  if (result.matchedCount === 0) {
    return next(new AppError("Festival not found", 404));
  }

  // if data already same
  if (result.modifiedCount === 0) {
    return next(new AppError("No changes made", 400));
  }

  return sendSuccess(res, "Festival updated successfully", {}, 200, true);
});
