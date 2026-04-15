import mongoose from "mongoose";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import eventModel from "../models/eventModel.js";

// ================= CREATE EVENT =================
export const createEvent = catchAsync(async (req, res, next) => {
  const {
    eventName,
    venueName,
    date,
    time,
    tabs,
    hashTags,
    bookingType,
    sponsors,
    artists,
    availableTickets,
    category,
    homeBanner,
    eventBanner,
    description,
    maxSeats,
    bookedSeats,
  } = req.body;

  // Required fields validation
  if (
    !eventName ||
    !venueName ||
    !date ||
    !time ||
    !bookingType ||
    !availableTickets ||
    !category
  ) {
    return next(new AppError("Required fields missing", 400));
  }

  const event = await eventModel.create({
    eventName,
    venueName,
    date,
    time,
    tabs: tabs || [],
    hashTags: hashTags || [],
    bookingType,
    sponsors: sponsors || [],
    artists: artists || [],
    availableTickets,
    category,
    homeBanner, // string URL
    eventBanner, // string URL
    description,
    maxSeats,
    bookedSeats,
  });

  return sendSuccess(res, "Event created successfully", event, 201, true);
});

// ================= GET ALL EVENTS (PAGINATION) =================
export const getAllEvents = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  page = page > 0 ? page : 1;
  limit = limit > 0 && limit <= 100 ? limit : 10;

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    eventModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    eventModel.countDocuments({ isActive: true }),
  ]);

  return sendSuccess(
    res,
    "Events fetched successfully",
    {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    200,
    true,
  );
});

// ================= GET SINGLE EVENT =================
export const getSingleEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid event id", 400));
  }

  const event = await eventModel.findById(id).lean();

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event fetched successfully", event, 200, true);
});

// ================= UPDATE EVENT =================
export const updateEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid event id", 400));
  }

  const allowedFields = [
    "eventName",
    "venueName",
    "date",
    "time",
    "tabs",
    "hashtags",
    "bookingType",
    "sponsors",
    "artists",
    "availableTickets",
    "category",
    "homeBanner",
    "eventBanner",
    "isActive",
  ];

  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError("Nothing to update", 400));
  }

  const event = await eventModel.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event updated successfully", event, 200, true);
});

// ================= DELETE EVENT (SOFT DELETE) =================
export const deleteEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid event id", 400));
  }

  const event = await eventModel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event deleted successfully", {}, 200, true);
});

export const getLatestEvent = catchAsync(async (req, res, next) => {
  const event = await eventModel.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 1 },

    // 🔹 Venue populate
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    // 🔹 Artists populate
    {
      $lookup: {
        from: "artists",
        localField: "artists",
        foreignField: "_id",
        as: "artists",
      },
    },

    // 🔹 BookingType populate
    {
      $lookup: {
        from: "bokkingtypes", //  collection name check kar lena
        localField: "bookingType",
        foreignField: "_id",
        as: "bookingType",
      },
    },
    { $unwind: "$bookingType" },

    //  Final shaping
    {
      $project: {
        _id: 1,
        eventName: 1,
        description: 1,
        date: 1,
        time: 1,
        tabs: 1,
        hashTags: 1,
        bookedSeats: 1,
        maxSeats: 1,
        availableTickets: 1,

        //  Venue (limited fields)
        venueName: {
          venue: "$venueName.venue",
          address: "$venueName.address",
        },

        //  BookingType (limited fields)
        bookingType: {
          name: "$bookingType.bookingType", // field name apne schema ke hisab se change kar lena
          price: "$bookingType.price",
        },

        //  Artists (limited fields)
        artists: {
          $map: {
            input: "$artists",
            as: "artist",
            in: {
              name: "$$artist.artistName",
              image: "$$artist.profileImage",
              about: "$$artist.about",
            },
          },
        },
      },
    },
  ]);
  if (!event.length) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event fetched successfully", event[0], 200, true);
});
