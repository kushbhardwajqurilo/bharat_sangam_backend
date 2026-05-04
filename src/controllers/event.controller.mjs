import mongoose from "mongoose";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import eventModel from "../models/eventModel.js";

// ================= CREATE EVENT =================
export const createEvent = catchAsync(async (req, res, next) => {
  console.log("body data", req.body);
  const {
    eventName,
    venueName,
    eventDate,
    startTime,
    endTime,
    instruments,
    hashtags,
    bookingTypes,
    sponsors,
    artists,
    availableTickets,
    eventCategories,
    homeBanner,
    eventBanner,
    totalCapacity,
    bookedSeats,
    ogImage,
    eventDescription,
  } = req.body;

  // Required fields validation
  if (
    (!eventName ||
      !venueName ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !bookingTypes ||
      !eventCategories ||
      !eventDescription,
    !ogImage)
  ) {
    return next(new AppError("Required fields missing", 400));
  }

  const event = await eventModel.create({
    eventName,
    venueName,
    date: eventDate,
    startTime,
    endTime,
    tabs: instruments || [],
    hashTags: hashtags || [],
    bookingType: bookingTypes,
    sponsors: sponsors || [],
    artists: artists || [],
    availableTickets,
    category: eventCategories,
    homeBanner, // string URL
    eventBanner, // string URL
    description: eventDescription,
    maxSeats: totalCapacity,
    availableTickets: totalCapacity,
    ogImage,
  });

  return sendSuccess(res, "Event created successfully", event, 201, true);
});

// ================= GET ALL EVENTS (PAGINATION) =================
// export const getAllEvents = catchAsync(async (req, res, next) => {
//   let { page = 1, limit = 10 } = req.query;
//   console.log("params", req.query);
//   page = parseInt(page);
//   limit = parseInt(limit);

//   page = page > 0 ? page : 1;
//   limit = limit > 0 && limit <= 100 ? limit : 10;

//   const skip = (page - 1) * limit;

//   const events = await eventModel.aggregate([
//     { $sort: { createdAt: -1 } },

//     // 🔹 Venue populate
//     {
//       $lookup: {
//         from: "venues",
//         localField: "venueName",
//         foreignField: "_id",
//         as: "venueName",
//       },
//     },
//     { $unwind: "$venueName" },

//     // 🔹 Artists populate
//     {
//       $lookup: {
//         from: "artists",
//         localField: "artists",
//         foreignField: "_id",
//         as: "artists",
//       },
//     },

//     // 🔹 BookingType populate
//     {
//       $lookup: {
//         from: "bokkingtypes", //  collection name check kar lena
//         localField: "bookingType",
//         foreignField: "_id",
//         as: "bookingType",
//       },
//     },
//     { $unwind: "$bookingType" },

//     //  Final shaping
//     {
//       $project: {
//         _id: 1,
//         eventName: 1,
//         description: 1,
//         date: 1,
//         time: 1,
//         tabs: 1,
//         hashTags: 1,
//         bookedSeats: 1,
//         maxSeats: 1,
//         availableTickets: 1,
//         eventBanner: 1,
//         homeBanner: 1,
//         ogImage: 1,
//         isActive: 1,
//         //  Venue (limited fields)
//         venueName: {
//           venue: "$venueName.venue",
//           address: "$venueName.address",
//         },

//         //  BookingType (limited fields)
//         bookingType: {
//           name: "$bookingType.bookingType", // field name apne schema ke hisab se change kar lena
//           price: "$bookingType.price",
//         },

//         //  Artists (limited fields)
//         artists: {
//           $map: {
//             input: "$artists",
//             as: "artist",
//             in: {
//               name: "$$artist.artistName",
//               image: "$$artist.profileImage",
//               about: "$$artist.about",
//             },
//           },
//         },
//       },
//     },
//   ]);

//   const total = events?.length;
//   return sendSuccess(
//     res,
//     "Events fetched successfully",
//     {
//       events,
//       pagination: {
//         total: total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     },
//     200,
//     true,
//   );
// });
export const getAllEvents = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  console.log("params", req.query);
  page = parseInt(page);
  limit = parseInt(limit);

  page = page > 0 ? page : 1;
  limit = limit > 0 && limit <= 100 ? limit : 10;

  const skip = (page - 1) * limit;

  const events = await eventModel.aggregate([
    { $sort: { createdAt: -1 } },

    // 🔹 Venue
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    // 🔹 Artists
    {
      $lookup: {
        from: "artists",
        localField: "artists",
        foreignField: "_id",
        as: "artists",
      },
    },
    // category
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },

    // 🔹 BookingType
    {
      $lookup: {
        from: "bokkingtypes",
        localField: "bookingType",
        foreignField: "_id",
        as: "bookingType",
      },
    },

    // 🔥 ✅ FIXED SPONSORS LOOKUP
    {
      $lookup: {
        from: "sponsors",
        let: { sponsorIds: "$sponsors" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  "$_id",
                  {
                    $map: {
                      input: "$$sponsorIds",
                      as: "id",
                      in: { $toObjectId: "$$id" }, // 🔥 FIX
                    },
                  },
                ],
              },
            },
          },
        ],
        as: "sponsors",
      },
    },

    // 🔹 Final Output
    {
      $project: {
        _id: 1,
        eventName: 1,
        description: 1,
        date: 1,
        startTime: 1,
        endTime: 1,
        tabs: 1,
        hashTags: 1,
        bookedSeats: 1,
        maxSeats: 1,
        availableTickets: 1,
        eventBanner: 1,
        homeBanner: 1,
        ogImage: 1,
        isActive: 1,

        venueName: {
          venue: "$venueName.venue",
          address: "$venueName.address",
        },

        bookingType: {
          $map: {
            input: "$bookingType",
            as: "bt",
            in: {
              name: "$$bt.bookingType",
              price: "$$bt.price",
            },
          },
        },
        categories: {
          $map: {
            input: "$category",
            as: "bt",
            in: "$$bt.categoryName",
          },
        },

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

        sponsors: {
          $map: {
            input: "$sponsors",
            as: "sponsor",
            in: "$$sponsor.sponsorName",
          },
        },
      },
    },
  ]);
  // console.log("event", events);
  const total = events?.length;
  return sendSuccess(
    res,
    "Events fetched successfully",
    {
      events,
      pagination: {
        total: total,
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

  const events = await eventModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },

    // 🔹 Venue
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    // 🔹 Artists
    {
      $lookup: {
        from: "artists",
        localField: "artists",
        foreignField: "_id",
        as: "artists",
      },
    },
    // category
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },

    // 🔹 BookingType
    {
      $lookup: {
        from: "bokkingtypes",
        localField: "bookingType",
        foreignField: "_id",
        as: "bookingType",
      },
    },

    {
      $lookup: {
        from: "sponsors",
        let: { sponsorIds: "$sponsors" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  "$_id",
                  {
                    $map: {
                      input: "$$sponsorIds",
                      as: "id",
                      in: { $toObjectId: "$$id" }, // 🔥 FIX
                    },
                  },
                ],
              },
            },
          },
        ],
        as: "sponsors",
      },
    },

    // 🔹 Final Output
    {
      $project: {
        _id: 1,
        eventName: 1,
        description: 1,
        date: 1,
        startTime: 1,
        endTime: 1,
        tabs: 1,
        hashTags: 1,
        bookedSeats: 1,
        maxSeats: 1,
        availableTickets: 1,
        eventBanner: 1,
        homeBanner: 1,
        ogImage: 1,
        isActive: 1,

        venueName: {
          venue: "$venueName.venue",
          address: "$venueName.address",
        },

        bookingType: {
          $map: {
            input: "$bookingType",
            as: "bt",
            in: {
              name: "$$bt.bookingType",
              price: "$$bt.price",
            },
          },
        },
        categories: {
          $map: {
            input: "$category",
            as: "bt",
            in: "$$bt.categoryName",
          },
        },

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

        sponsors: {
          $map: {
            input: "$sponsors",
            as: "sponsor",
            in: "$$sponsor.sponsorName",
          },
        },
      },
    },
  ]);
  console.log("single event", events);
  if (!events) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event fetched successfully", events[0], 200, true);
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
    "startTime",
    "endTime",
    "instruments",
    "hashtags",
    "bookingTypes",
    "sponsors",
    "artists",
    "availableTickets",
    "eventCategory",
    "eventDescription",
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
  const {
    eventName,
    venueName,
    eventDate,
    startTime,
    endTime,
    instruments,
    hashtags,
    bookingTypes,
    sponsors,
    artists,
    availableTickets,
    eventCategories,
    homeBanner,
    eventBanner,
    totalCapacity,
    bookedSeats,
    ogImage,
    eventDescription,
  } = req.body;
  console.log("uupdate", req.body);
  const updateData = {
    eventName,
    venueName,
    date: eventDate,
    startTime,
    endTime,
    tabs: instruments || [],
    hashTags: hashtags || [],
    bookingType: bookingTypes,
    sponsors: sponsors || [],
    artists: artists || [],
    availableTickets,
    category: eventCategories,
    homeBanner, // string URL
    eventBanner, // string URL
    description: eventDescription,
    maxSeats: totalCapacity,
    ogImage,
  };
  const event = await eventModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event updated successfully", {}, 200, true);
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
        startTime: 1,
        endTime: 1,
        tabs: 1,
        hashTags: 1,
        bookedSeats: 1,
        maxSeats: 1,
        availableTickets: 1,
        eventBanner: 1,
        homeBanner: 1,
        ogImage: 1,
        //  Venue (limited fields)
        venueName: {
          venue: "$venueName.venue",
          address: "$venueName.address",
          _id: "$venueName._id",
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
              profileImage: "$$artist.profileImage",
              about: "$$artist.about",
              galleryImages: "$$artist.galleryImages",
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

//

// event capecity api
export const latestEventCapacity = catchAsync(async (req, res, next) => {
  const event = await eventModel
    .findOne({})
    .sort({ createdAt: -1 })
    .select("maxSeats bookedSeats availableTickets _id ")
    .lean();
  if (!event) {
    return next(new AppError("failed to fetch", 400));
  }
  const payload = {
    eventId: event?._id,
    maxSeats: event?.maxSeats,
    bookedSeats: event?.bookedSeats,
    availableTickets: event?.availableTickets,
    isSoldOut: event?.maxSeats === event?.bookedSeats,
  };
  return sendSuccess(res, "success", payload, 200, true);
});
