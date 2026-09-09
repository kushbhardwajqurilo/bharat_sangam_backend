import mongoose from "mongoose";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import eventModel from "../models/eventModel.js";
import bookingModel from "../models/bookingModel.js";

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

//     //  Venue populate
//     {
//       $lookup: {
//         from: "venues",
//         localField: "venueName",
//         foreignField: "_id",
//         as: "venueName",
//       },
//     },
//     { $unwind: "$venueName" },

//     //  Artists populate
//     {
//       $lookup: {
//         from: "artists",
//         localField: "artists",
//         foreignField: "_id",
//         as: "artists",
//       },
//     },

//     //  BookingType populate
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

    //  Venue
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    //  Artists (Only Approved & Active)
    {
      $lookup: {
        from: "artists",
        let: { artistIds: { $ifNull: ["$artists", []] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$artistIds"] },
                  { $eq: ["$status", "approved"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
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

    //  BookingType
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

    //  Final Output
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
              about: { $ifNull: ["$$artist.aboutArtist", "$$artist.about"] },
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

    //  Venue
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    //  Artists (Only Approved & Active)
    {
      $lookup: {
        from: "artists",
        let: { artistIds: { $ifNull: ["$artists", []] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$artistIds"] },
                  { $eq: ["$status", "approved"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
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

    //  BookingType
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

    //  Final Output
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
              about: { $ifNull: ["$$artist.aboutArtist", "$$artist.about"] },
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
  const to12Hour = (time) => {
    let [h, m] = time.split(":");
    h = Number(h);

    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    return `${h}:${m} ${ampm}`;
  };
  const event = await eventModel.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 1 },

    //  Venue populate
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    //  Artists populate (Only Approved & Active)
    {
      $lookup: {
        from: "artists",
        let: { artistIds: { $ifNull: ["$artists", []] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$artistIds"] },
                  { $eq: ["$status", "approved"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "artists",
      },
    },

    //  BookingType populate
    {
      $lookup: {
        from: "bokkingtypes", //  collection name check kar lena
        localField: "bookingType",
        foreignField: "_id",
        as: "bookingType",
      },
    },
    // { $unwind: "$bookingType" },

    //  Final shaping
    {
      $project: {
        _id: 1,
        eventName: 1,
        description: 1,
        date: 1,
        // time: { $concat: ["$startTime", " To ", "$endTime"] },
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
          $map: {
            input: "$bookingType",
            as: "type",
            in: {
              name: "$$type.bookingType",
              price: "$$type.price",
              _id: "$$type._id",
              subtitle: "$$type.subtitle",
              isPopular: "$$type.isPopular",
              features: "$$type.features",
            },
          },
        },

        //  Artists (limited fields)
        artists: {
          $map: {
            input: "$artists",
            as: "artist",
            in: {
              name: "$$artist.artistName",
              profileImage: "$$artist.profileImage",
              about: { $ifNull: ["$$artist.aboutArtist", "$$artist.about"] },
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
  event[0].time = `${to12Hour(event[0].startTime)} To ${to12Hour(event[0].endTime)}`;
  // delete event[0].startTime;
  // delete event[0].endTime;
  return sendSuccess(res, "Event fetched successfully", event[0], 200, true);
});

// Previous all Event;
export const getAllPreviousEvents = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  page = page > 0 ? page : 1;
  limit = limit > 0 && limit <= 100 ? limit : 10;

  const skip = (page - 1) * limit;

  const to12Hour = (time) => {
    let [h, m] = time.split(":");
    h = Number(h);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h} : ${m} ${ampm}`;
  };
  const event = await eventModel.aggregate([
    { $sort: { createdAt: -1 } }, // Latest event first
    { $skip: 1 }, // Skip the latest event

    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },
    { $unwind: "$venueName" },

    {
      $lookup: {
        from: "artists",
        let: { artistIds: { $ifNull: ["$artists", []] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$artistIds"] },
                  { $eq: ["$status", "approved"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "artists",
      },
    },

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
        artists: 1,
        venueName: {
          venue: "$venueName.venue",
          address: "$venueName.address",
          _id: "$venueName._id",
        },
      },
    },
  ]);
  if (!event || !event.length) {
    return next(new AppError("Events not found", 400));
  }

  const total = event?.length;
  const paginatedEvents = event.slice(skip, skip + limit);

  return sendSuccess(
    res,
    "success",
    {
      events: paginatedEvents,
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

// <------- add Manual Attended ------>

export const addManualAttended = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { manualAttendance } = req.body;
  if (!id) {
    return next(new AppError("Event Id Missing", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Event Id", 400));
  }
  if (!manualAttendance) {
    return next(new AppError("Attentance Missing", 400));
  }
  const result = await eventModel.updateOne(
    { _id: id },
    { $set: { manualAttendance: manualAttendance } },
  );
  if (result.matchedCount === 0) {
    return next(new AppError("Unable to add attendace", 400));
  }
  return sendSuccess(res, "Success", {}, 201, true);
});

// <------- add Manual Attended end ------>

// < ------ Admin Dashboard Event Analytics Start Here -------- >

export const dahsboardCardAnalytics = catchAsync(async (req, res, next) => {
  let analytics = await eventModel.aggregate([
    // 🔹 Latest Events
    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $limit: 3,
    },

    // 🔹 Venue Lookup
    {
      $lookup: {
        from: "venues",
        localField: "venueName",
        foreignField: "_id",
        as: "venueName",
      },
    },

    {
      $unwind: "$venueName",
    },

    // 🔹 Booking Lookup
    {
      $lookup: {
        from: "bookings",
        localField: "_id",
        foreignField: "eventId",
        as: "bookings",
      },
    },

    // 🔹 Total Registrations
    {
      $addFields: {
        totalRegistration: {
          $size: "$bookings",
        },
      },
    },

    // 🔹 Barcode Entries Count + Used Tickets Sum
    {
      $addFields: {
        // ✅ Count of bookings where isUsed = true
        barcodeEntries: {
          $size: {
            $filter: {
              input: "$bookings",
              as: "booking",
              cond: {
                $eq: ["$$booking.isUsed", true],
              },
            },
          },
        },

        // ✅ Sum of totalTicket where isUsed = true
        usedTickets: {
          $sum: {
            $map: {
              input: "$bookings",

              as: "booking",

              in: {
                $ifNull: ["$$booking.visitUsers", 0],
              },
            },
          },
        },
      },
    },

    // 🔹 Attended Tickets
    {
      $addFields: {
        attended: {
          $add: [
            // ✅ Used Ticket Count
            "$usedTickets",

            // ✅ Manual Attendance
            {
              $ifNull: ["$manualAttendance", 0],
            },
          ],
        },
      },
    },

    // 🔹 Final Output
    {
      $project: {
        id: "$_id",

        title: "$eventName",

        date: 1,

        bookedSeats: 1,

        attended: 1,

        barcodeEntries: 1,

        usedTickets: 1,

        totalRegistration: 1,

        venueName: {
          $concat: ["$venueName.venue", ", ", "$venueName.address"],
        },
      },
    },
  ]);

  // 🔹 Attendance Delta + Status
  analytics = analytics.map((event, index) => {
    const previousEvent = analytics[index + 1];

    let attendanceRateDelta = 0;

    if (previousEvent && previousEvent.attended > 0) {
      attendanceRateDelta =
        ((event.attended - previousEvent.attended) / previousEvent.attended) *
        100;
    }

    // 🔹 Event Status
    let status = "unknown";

    if (index === 0) {
      status = "current";
    } else if (index === 1) {
      status = "last";
    } else if (index >= 2) {
      status = "earlier";
    }

    return {
      id: event.id,

      title: event.title,

      date: event.date,

      venue: event.venueName,

      status,

      stats: {
        totalBookings: event.bookedSeats,

        attended: event.attended,

        attendanceRateDelta: Number(attendanceRateDelta.toFixed(2)),

        totalRegistrations: event.totalRegistration,

        // ✅ Count of used bookings
        barcodeEntries: event.usedTickets,

        // ✅ Sum of used booking tickets
      },
    };
  });

  // 🔹 Add Dummy Data If Only One Event Exists
  if (analytics.length === 1) {
    analytics.push(
      {
        id: "69e72496d6dbf594ad9cdbad",

        title: "Bharat Bhakti Sangam 2026 2.0",

        date: "",

        venue: "",

        status: "last",

        stats: {
          totalBookings: 0,
          attended: 0,
          attendanceRateDelta: 0,
          totalRegistrations: 0,
          barcodeEntries: 0,
        },
      },

      {
        id: "69e72496d6dbf594ad9cdbaf",

        title: "Bharat Bhakti Sangam 2026 3.0",

        date: "",

        venue: "",

        status: "earlier",

        stats: {
          totalBookings: 0,
          attended: 0,
          attendanceRateDelta: 0,
          totalRegistrations: 0,
        },
      },
    );
  }

  return res.status(200).json({
    success: true,
    analytics,
  });
});

// dashboard chart
// export const dashboardLineChartAnalytics = catchAsync(
//   async (req, res, next) => {
//     const data = await bookingModel.aggregate([
//       //  Group By Real Date
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//             day: { $dayOfMonth: "$createdAt" },
//           },

//           totalTickets: {
//             $sum: "$totalTicket",
//           },

//           totalBookings: {
//             $sum: 1,
//           },
//         },
//       },

//       //  Proper Date Sorting
//       {
//         $sort: {
//           "_id.year": 1,
//           "_id.month": 1,
//           "_id.day": 1,
//         },
//       },

//       //  Final Response
//       {
//         $project: {
//           _id: 0,

//           date: {
//             $concat: [
//               { $toString: "$_id.day" },
//               "-",
//               { $toString: "$_id.month" },
//               "-",
//               { $toString: "$_id.year" },
//             ],
//           },
//           totalTickets: 1,
//         },
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   },
// );

// export const dashboardLineChartAnalytics = catchAsync(
//   async (req, res, next) => {
//     const data = await bookingModel.aggregate([
//       // 🔹 Group By Real Date
//       {
//         $group: {
//           _id: {
//             year: {
//               $year: {
//                 date: "$createdAt",
//                 timezone: "Asia/Kolkata",
//               },
//             },

//             month: {
//               $month: {
//                 date: "$createdAt",
//                 timezone: "Asia/Kolkata",
//               },
//             },

//             day: {
//               $dayOfMonth: {
//                 date: "$createdAt",
//                 timezone: "Asia/Kolkata",
//               },
//             },
//           },

//           totalTickets: {
//             $sum: "$totalTicket",
//           },

//           totalBookings: {
//             $sum: 1,
//           },
//         },
//       },

//       // 🔹 Proper Date Sorting
//       {
//         $sort: {
//           "_id.year": 1,
//           "_id.month": 1,
//           "_id.day": 1,
//         },
//       },

//       // 🔹 Final Response
//       {
//         $project: {
//           _id: 0,

//           date: {
//             $concat: [
//               { $toString: "$_id.day" },
//               "-",
//               { $toString: "$_id.month" },
//               "-",
//               { $toString: "$_id.year" },
//             ],
//           },

//           totalTickets: 1,

//           totalBookings: 1,
//         },
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   },
// );

export const dashboardLineChartAnalytics = catchAsync(
  async (req, res, next) => {
    const data = await bookingModel.aggregate([
      // 🔹 Group By Real Date
      {
        $group: {
          _id: {
            year: {
              $year: {
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },

            month: {
              $month: {
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },

            day: {
              $dayOfMonth: {
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
          },

          totalTickets: {
            $sum: "$totalTicket",
          },

          totalBookings: {
            $sum: 1,
          },
        },
      },

      // 🔹 Proper Date Sorting
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },

      // 🔹 Final Response
      {
        $project: {
          _id: 0,

          date: {
            $concat: [
              { $toString: "$_id.day" },
              "-",
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.year" },
            ],
          },

          totalTickets: 1,

          totalBookings: 1,
        },
      },
    ]);

    // // 🔹 Add Extra Object
    // data.push(
    //   {
    //     totalTickets: 77,
    //     totalBookings: 30,
    //     date: "17-5-2026",
    //   },

    //   {
    //     totalTickets: 68,
    //     totalBookings: 25,
    //     date: "16-5-2026",
    //   },
    // );

    return res.status(200).json({
      success: true,
      data,
    });
  },
);
// export const dashboardBarChartAnalytics = catchAsync(async (req, res, next) => {
//   const { date } = req.query;
//   const startDate = new Date(date);
//   startDate.setHours(0, 0, 0, 0);

//   const endDate = new Date(date);
//   endDate.setHours(23, 59, 59, 999);

//   const data = await bookingModel.aggregate([
//     // 🔹 Filter By Date
//     {
//       $match: {
//         createdAt: {
//           $gte: startDate,
//           $lte: endDate,
//         },
//       },
//     },

//     // 🔹 Event Lookup
//     {
//       $lookup: {
//         from: "events",
//         localField: "eventId",
//         foreignField: "_id",
//         as: "event",
//       },
//     },

//     // 🔹 Convert Array To Object
//     {
//       $unwind: "$event",
//     },

//     // 🔹 Group By Event
//     {
//       $group: {
//         _id: "$event._id",

//         eventName: {
//           $first: "$event.eventName",
//         },

//         totalTickets: {
//           $sum: "$totalTicket",
//         },

//         totalBookings: {
//           $sum: 1,
//         },
//       },
//     },

//     // 🔹 Final Response
//     {
//       $project: {
//         _id: 0,

//         eventId: "$_id",
//         eventName: 1,
//         totalBooking: "$totalTickets",
//         totalRegistrations: "$totalBookings",
//       },
//     },
//   ]);

//   return res.status(200).json({
//     success: true,
//     data,
//   });
// });

export const dashboardBarChartAnalytics = catchAsync(async (req, res, next) => {
  const { date } = req.query;

  // ✅ Asia/Kolkata Timezone Date Range
  const startDate = new Date(`${date}T00:00:00.000+05:30`);
  const endDate = new Date(`${date}T23:59:59.999+05:30`);

  const data = await bookingModel.aggregate([
    // 🔹 Filter By IST Date
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },

    // 🔹 Event Lookup
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },

    // 🔹 Convert Array To Object
    {
      $unwind: "$event",
    },

    // 🔹 Group By Event
    {
      $group: {
        _id: "$event._id",

        eventName: {
          $first: "$event.eventName",
        },

        totalTickets: {
          $sum: "$totalTicket",
        },

        totalBookings: {
          $sum: 1,
        },
      },
    },

    // 🔹 Final Response
    {
      $project: {
        _id: 0,

        eventId: "$_id",

        eventName: 1,

        totalBooking: "$totalTickets",

        totalRegistrations: "$totalBookings",
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    data,
  });
});
