import { createCanvas, loadImage } from "canvas";
import QRCode from "qrcode";
import path from "path";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import { generateQRToken } from "../utils/ticketToken.mjs";
import bookingModel from "../models/bookingModel.js";
import { generateTicketHTML } from "../utils/ticketTemplate.mjs";
import { sendTicketEmail } from "../config/mail.config.mjs";
import puppeteer from "puppeteer";
import { ticketQueue } from "../queues/ticket.queue.mjs";
import eventModel from "../models/eventModel.js";
import mongoose from "mongoose";
import Payment from "../models/payment.model.mjs";
import bookingReserveModel from "../models/bookingReserveModel.mjs";

// export const createTicket = catchAsync(async (req, res, next) => {
//   const {
//     username,
//     email,
//     eventId,
//     totalTicket = 5,
//     allowVisitors = 5,
//     amount = 100,
//     phone = 1234567890,
//   } = req.body;

//   function getRandom(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
//   }
//   const u_id = `BBS${getRandom(100000, 999999)}`;
//   // 💾 Save ticket
//   const ticket = await bookingModel.create({
//     username,
//     email,
//     eventId,
//     totalTicket,
//     allowVisitors,
//     amount,
//     phone,
//     u_id,
//   });

//   const id = ticket.u_id.toString();

//   // 🖼️ Load background image
//   const imagePath = path.join(process.cwd(), "src/public", "ticketDesign.jpg");
//   const background = await loadImage(imagePath);

//   // 🎨 Canvas
//   const canvas = createCanvas(background.width, background.height);
//   const ctx = canvas.getContext("2d");

//   // Background draw
//   ctx.drawImage(background, 0, 0);

//   // 🔳 QR (ONLY ID)
//   const qrDataUrl = await QRCode.toDataURL(id);
//   const qrImage = await loadImage(qrDataUrl);

//   // 📏 Size & Position
//   const qrSize = 220;
//   const x = background.width * 0.58;
//   const y = background.height * 0.32;

//   // White background for QR
//   ctx.fillStyle = "#fff";
//   ctx.fillRect(x - 10, y - 10, qrSize + 20, qrSize + 20);

//   // Draw QR
//   ctx.drawImage(qrImage, x, y, qrSize, qrSize);

//   // 📤 Send image
//   res.setHeader("Content-Type", "image/png");
//   canvas.createPNGStream().pipe(res);
// });

export const createTicket = catchAsync(async (req, res, next) => {
  ///
  const latestEvent = await eventModel.findOne().sort({ createdAt: -1 });

  if (!latestEvent) {
    return res.status(404).json({
      success: false,
      message: "No event found",
    });
  }

  // Event end datetime banao
  const [hours, minutes] = latestEvent.endTime.split(":");

  const eventEndDateTime = new Date(latestEvent.date);
  eventEndDateTime.setHours(Number(hours));
  eventEndDateTime.setMinutes(Number(minutes));
  eventEndDateTime.setSeconds(0);

  const currentDateTime = new Date();

  if (currentDateTime > eventEndDateTime) {
    return next(new AppError("Event has been ended", 400));
  }

  // console.log("payment data", req.body.payment);
  const { username, email, eventId, totalTicket, phone } = req.body;

  console.log("🟢 STEP 1: API HIT");
  // if (totalTicket > 5) {
  //   return next(
  //     new AppError("You have exceeded the maximum ticket limit.", 400),
  //   );
  // }

  const isAlreadyBooked = await bookingModel
    .findOne({ eventId: eventId, phone: phone })
    .sort({ createdAt: -1 });
  if (isAlreadyBooked) {
    return next(
      new AppError(
        "this number has already been used for booking tickets",
        400,
      ),
    );
  }
  const u_id = `BBS${Math.floor(100000 + Math.random() * 900000)}`;
  const ticket = await bookingModel.create({
    username,
    email,
    eventId,
    u_id,
    totalTicket,
    allowVisitors: totalTicket,
    phone: Number(phone),
  });
  // Check + reduce tickets (atomic)

  const event = await eventModel.findOneAndUpdate(
    { _id: eventId, availableTickets: { $gte: totalTicket } },
    {
      $inc: {
        availableTickets: -totalTicket,
        bookedSeats: totalTicket,
      },
    },
    { new: true },
  );

  if (!event) {
    return next(new AppError("Tickets sold out", 400));
  }
  // console.log("🟢 STEP 2: Ticket Created", ticket._id);

  // 🔥 ADD JOB WITH DEBUG
  try {
    // console.log("🟡 STEP 3: Adding job to queue...");

    const job = await ticketQueue.add("generateTicket", {
      ticketId: ticket._id,
      username,
      email,
      phone: Number(phone),
      u_id,
      allowVisitors: totalTicket,
    });

    // console.log("✅ STEP 4: JOB ADDED SUCCESS:", job.id);
    // console.log("queue jon", job);
  } catch (err) {
    console.error("❌ STEP 4 ERROR: Queue failed", err);
  }

  // console.log("🟢 STEP 5: Sending response");

  res.status(200).json({
    success: true,
    message: "Ticket created 🎉",
    bookingId: u_id,
  });
});

// export const createTicket = catchAsync(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   let ticket;

//   try {
//     await session.withTransaction(async () => {
//       const { username, email, eventId, totalTicket, phone, payment } =
//         req.body;
//       const normalizedPhone = Number(phone);

//       if (totalTicket > 5) {
//         throw new AppError("You have exceeded the maximum ticket limit.", 400);
//       }

//       if (
//         !payment?.orderId ||
//         !payment?.paymentId ||
//         payment.status !== "paid"
//       ) {
//         throw new AppError("Valid paid payment is required.", 400);
//       }

//       const existingPayment = await Payment.findOne({
//         $or: [{ orderId: payment.orderId }, { paymentId: payment.paymentId }],
//       }).session(session);

//       if (existingPayment?.bookingId) {
//         ticket = await bookingModel
//           .findById(existingPayment.bookingId)
//           .session(session);
//         return;
//       }

//       const event = await eventModel.findOneAndUpdate(
//         {
//           _id: eventId,
//           isActive: true,
//           availableTickets: { $gte: totalTicket },
//         },
//         {
//           $inc: {
//             availableTickets: -totalTicket,
//             bookedSeats: totalTicket,
//           },
//         },
//         { new: true, session },
//       );

//       if (!event) {
//         throw new AppError("Tickets sold out", 400);
//       }

//       const u_id = `BBS${Math.floor(100000 + Math.random() * 900000)}`;

//       [ticket] = await bookingModel.create(
//         [
//           {
//             username,
//             email,
//             eventId,
//             u_id,
//             totalTicket,
//             amount: payment.amount,
//             allowVisitors: totalTicket,
//             phone: normalizedPhone,
//             paymentStatus: "success",
//           },
//         ],
//         { session },
//       );

//       await Payment.findOneAndUpdate(
//         { orderId: payment.orderId },
//         {
//           $set: {
//             ...payment,
//             eventId,
//             bookingId: ticket._id,
//             phone: normalizedPhone,
//             paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
//           },
//         },
//         { new: true, upsert: true, session },
//       );
//     });

//     await session.endSession();

//     await ticketQueue.add("generateTicket", {
//       ticketId: ticket._id,
//       username: ticket.username,
//       email: ticket.email,
//       phone: ticket.phone,
//       u_id: ticket.u_id,
//       allowVisitors: ticket.allowVisitors,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Ticket created",
//       bookingId: ticket.u_id,
//     });
//   } catch (error) {
//     await session.endSession();
//     return next(error);
//   }
// });

// export const createTicket = catchAsync(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   let ticket;

//   try {
//     await session.withTransaction(async () => {
//       const {
//         username,
//         email,
//         eventId,
//         totalTicket,
//         phone,
//         reservationId,
//         payment,
//       } = req.body;

//       const normalizedPhone = Number(phone);

//       if (!reservationId) {
//         throw new AppError("Reservation is required.", 400);
//       }

//       if (
//         !payment?.orderId ||
//         !payment?.paymentId ||
//         payment.status !== "paid"
//       ) {
//         throw new AppError("Valid paid payment is required.", 400);
//       }

//       const existingPayment = await Payment.findOne({
//         $or: [{ orderId: payment.orderId }, { paymentId: payment.paymentId }],
//       }).session(session);

//       if (existingPayment?.bookingId) {
//         ticket = await bookingModel
//           .findById(existingPayment.bookingId)
//           .session(session);
//         return;
//       }

//       const reservation = await bookingReserveModel
//         .findOne({
//           _id: reservationId,
//           eventId,
//           phone: normalizedPhone,
//           totalTicket,
//           status: "reserved",
//           expiresAt: { $gt: new Date() },
//         })
//         .session(session);

//       if (!reservation) {
//         throw new AppError("Reservation expired or invalid.", 400);
//       }

//       const alreadyBooked = await bookingModel
//         .findOne({ eventId, phone: normalizedPhone })
//         .session(session);

//       if (alreadyBooked) {
//         throw new AppError(
//           "this number has already been used for booking tickets",
//           400,
//         );
//       }

//       const u_id = `BBS${Math.floor(100000 + Math.random() * 900000)}`;

//       [ticket] = await bookingModel.create(
//         [
//           {
//             username,
//             email,
//             eventId,
//             u_id,
//             totalTicket,
//             amount: payment.amount,
//             allowVisitors: totalTicket,
//             phone: normalizedPhone,
//             paymentStatus: "success",
//           },
//         ],
//         { session },
//       );

//       await Payment.findOneAndUpdate(
//         { orderId: payment.orderId },
//         {
//           $set: {
//             ...payment,
//             eventId,
//             bookingId: ticket._id,
//             phone: normalizedPhone,
//             paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
//           },
//         },
//         { new: true, upsert: true, session },
//       );

//       await bookingReserveModel
//         .updateOne(
//           { _id: reservation._id, status: "reserved" },
//           {
//             $set: {
//               status: "confirmed",
//               orderId: payment.orderId,
//               paymentId: payment.paymentId,
//               bookingId: ticket._id,
//             },
//           },
//         )
//         .session(session);
//     });

//     const sessionResponse = await session.endSession();
//     console.log("session response", sessionResponse);
//     await ticketQueue.add("generateTicket", {
//       ticketId: ticket._id,
//       username: ticket.username,
//       email: ticket.email,
//       phone: ticket.phone,
//       u_id: ticket.u_id,
//       allowVisitors: ticket.allowVisitors,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Ticket created",
//       bookingId: ticket.u_id,
//     });
//   } catch (error) {
//     await session.endSession();
//     return next(error);
//   }
// });

// export const createTicket = catchAsync(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   let ticket;

//   try {
//     // ── Manually start transaction for explicit commit control ────────────────
//     session.startTransaction();

//     const {
//       username,
//       email,
//       eventId,
//       totalTicket,
//       phone,
//       reservationId,
//       payment,
//     } = req.body;

//     // ── Validate inputs ───────────────────────────────────────────────────────
//     if (!reservationId) {
//       throw new AppError("Reservation is required.", 400);
//     }

//     if (!payment?.orderId || !payment?.paymentId || payment.status !== "paid") {
//       throw new AppError("Valid paid payment is required.", 400);
//     }

//     const normalizedPhone = Number(phone);

//     // ── Idempotency: if payment already processed, return existing ticket ─────
//     const existingPayment = await Payment.findOne({
//       $or: [{ orderId: payment.orderId }, { paymentId: payment.paymentId }],
//     }).session(session);

//     if (existingPayment?.bookingId) {
//       ticket = await bookingModel
//         .findById(existingPayment.bookingId)
//         .session(session);

//       // Commit and exit early — ticket already exists
//       await session.commitTransaction();
//       await session.endSession();

//       return res.status(200).json({
//         success: true,
//         message: "Ticket already created",
//         bookingId: ticket.u_id,
//       });
//     }

//     // ── Validate reservation ──────────────────────────────────────────────────
//     const reservation = await bookingReserveModel
//       .findOne({
//         _id: reservationId,
//         eventId,
//         phone: normalizedPhone,
//         totalTicket,
//         status: "reserved",
//         expiresAt: { $gt: new Date() },
//       })
//       .session(session);

//     if (!reservation) {
//       throw new AppError("Reservation expired or invalid.", 400);
//     }

//     // ── Check duplicate booking ───────────────────────────────────────────────
//     const alreadyBooked = await bookingModel
//       .findOne({ eventId, phone: normalizedPhone })
//       .session(session);

//     if (alreadyBooked) {
//       throw new AppError(
//         "This number has already been used for booking tickets.",
//         400,
//       );
//     }

//     // ── Generate unique booking ID ────────────────────────────────────────────
//     const u_id = `BBS${Math.floor(100000 + Math.random() * 900000)}`;

//     // ── Create booking ────────────────────────────────────────────────────────
//     [ticket] = await bookingModel.create(
//       [
//         {
//           username,
//           email,
//           eventId,
//           u_id,
//           totalTicket,
//           amount: payment.amount,
//           allowVisitors: totalTicket,
//           phone: normalizedPhone,
//           paymentStatus: "success",
//         },
//       ],
//       { session },
//     );

//     // ── Upsert payment record ─────────────────────────────────────────────────
//     await Payment.findOneAndUpdate(
//       { orderId: payment.orderId },
//       {
//         $set: {
//           ...payment,
//           eventId,
//           bookingId: ticket._id,
//           phone: normalizedPhone,
//           paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
//         },
//       },
//       { new: true, upsert: true, session },
//     );

//     // ── Confirm reservation ───────────────────────────────────────────────────
//     await bookingReserveModel
//       .updateOne(
//         { _id: reservation._id, status: "reserved" },
//         {
//           $set: {
//             status: "confirmed",
//             orderId: payment.orderId,
//             paymentId: payment.paymentId,
//             bookingId: ticket._id,
//           },
//         },
//       )
//       .session(session);

//     // ── Commit transaction — data is now durable in DB ────────────────────────
//     await session.commitTransaction();
//     await session.endSession();

//     // ── Enqueue ticket generation AFTER commit (fixes race condition) ─────────
//     // The worker's aggregate query will now always find the booking document.
//     await ticketQueue.add("generateTicket", {
//       ticketId: ticket._id.toString(),
//       username: ticket.username,
//       email: ticket.email,
//       phone: ticket.phone,
//       u_id: ticket.u_id,
//       allowVisitors: ticket.allowVisitors,
//     });

//     // ── Respond to client ─────────────────────────────────────────────────────
//     return res.status(200).json({
//       success: true,
//       message: "Ticket created",
//       bookingId: ticket.u_id,
//     });
//   } catch (error) {
//     // Only abort if the transaction is still open
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     await session.endSession();
//     return next(error);
//   }
// });

// reserver ticket
// export const reserveTickets = catchAsync(async (req, res, next) => {
//   const session = await mongoose.startSession();

//   try {
//     let reservation;

//     await session.withTransaction(async () => {
//       const { username, email, eventId, totalTicket, phone, ticketType } =
//         req.body;
//       const normalizedPhone = Number(phone);

//       if (!eventId || !totalTicket || !normalizedPhone) {
//         throw new AppError("Invalid reservation request.", 400);
//       }

//       if (totalTicket > 5) {
//         throw new AppError("You have exceeded the maximum ticket limit.", 400);
//       }

//       const existingBooking = await bookingModel
//         .findOne({ eventId, phone: normalizedPhone })
//         .session(session);

//       if (existingBooking) {
//         throw new AppError(
//           "this number has already been used for booking tickets",
//           400,
//         );
//       }

//       const existingReservation = await bookingReserveModel
//         .findOne({
//           eventId,
//           phone: normalizedPhone,
//           status: "reserved",
//           expiresAt: { $gt: new Date() },
//         })
//         .session(session);

//       if (existingReservation) {
//         reservation = existingReservation;
//         return;
//       }

//       const event = await eventModel.findOneAndUpdate(
//         {
//           _id: eventId,
//           isActive: true,
//           availableTickets: { $gte: totalTicket },
//         },
//         {
//           $inc: {
//             availableTickets: -totalTicket,
//             bookedSeats: totalTicket,
//           },
//         },
//         { new: true, session },
//       );

//       if (!event) {
//         throw new AppError("Tickets sold out", 400);
//       }

//       [reservation] = await bookingReserveModel.create(
//         [
//           {
//             eventId,
//             username,
//             email,
//             phone: normalizedPhone,
//             totalTicket,
//             ticketType,
//             expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//           },
//         ],
//         { session },
//       );
//     });

//     res.status(201).json({
//       success: true,
//       data: {
//         reservationId: reservation._id,
//         expiresAt: reservation.expiresAt,
//       },
//     });
//   } finally {
//     await session.endSession();
//   }
// });

// ticket details bt scan
export const getTicketDetails = catchAsync(async (req, res, next) => {
  const { u_id } = req.query;
  if (!u_id) {
    return res.send("<h2>❌ Invalid QR</h2>");
  }
  const ticket = await bookingModel.findOne({ u_id });
  if (!ticket) {
    return res.send("<h2>❌ Ticket Not Found</h2>");
  }
  return sendSuccess(res, "success", ticket, 200, true);
});

export const verifyTicket = catchAsync(async (req, res, next) => {
  const { u_id } = req.query;
  const { allow_user } = req.body;

  // Validate input
  if (!u_id) {
    return res.send("<h2>❌ Invalid QR</h2>");
  }

  const visitorsComing = Number(allow_user);

  if (!visitorsComing || visitorsComing <= 0) {
    return next(new AppError("Enter valid number of visitors"));
  }

  try {
    const ticket = await bookingModel.findOne({ u_id });

    if (!ticket) {
      return res.send("<h2>❌ Ticket Not Found</h2>");
    }

    // If already fully used
    if (ticket.isUsed) {
      return next(new AppError("Ticket already used", 400));
    }

    // If no visitors left
    if (ticket.allowVisitors <= 0 || ticket.totalTicket === ticket.visitUsers) {
      ticket.isUsed = true;
      await ticket.save();
      return next(new AppError("All visitors already verified", 400));
    }

    // If trying to enter more than remaining
    if (visitorsComing > ticket.allowVisitors) {
      return next(
        new AppError(
          `Only ${ticket.allowVisitors} visitors allowed, but received ${visitorsComing}`,
          400,
        ),
      );
    }

    // Deduct visitors
    ticket.allowVisitors -= visitorsComing;
    ticket.visitUsers += visitorsComing;

    // If all visitors entered → mark used
    if (ticket.allowVisitors === 0) {
      ticket.isUsed = true;
      ticket.usedAt = new Date();
    }

    await ticket.save();

    return sendSuccess(res, "success", {}, 201, true);
  } catch (err) {
    return next(new AppError(`Something went wrong ${err}`, 400));
  }
});

export const getTicketDetailsByPhone = catchAsync(async (req, res, next) => {
  // console.log("query", req.query);
  const { phone } = req.query;
  if (!phone) {
    return next(new AppError("phone number required"), 400);
  }
  const cleaned = phone.replace(/^(\+91|91)/, "").replace(/\D/g, "");

  if (cleaned.length !== 10) {
    throw new Error("Invalid phone number");
  }
  // console.log(cleaned);
  const event = await eventModel
    .findOne({})
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();
  const ticket = await bookingModel
    .findOne({ phone: cleaned, eventId: event?._id })
    .sort({ createdAt: -1 });
  if (!ticket) {
    return sendSuccess(res, "ticket not found", {}, 200, true);
  }
  return sendSuccess(res, "success", ticket, 200, true);
});

// get all booking
export const getAllBookings = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req?.query;
  const { search } = req?.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const pipeline = [];

  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$phone" },
                regex: search,
                options: "i",
              },
            },
          },
          { u_id: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    {
      $lookup: {
        from: "events",
        let: { eventId: "$eventId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$eventId"] },
            },
          },
          {
            $project: {
              _id: 0,
              eventName: 1,
            },
          },
        ],
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ["$username", "N/A"] },
        email: 1,
        tickets: "$totalTicket",
        eventName: { $ifNull: ["$event.eventName", "N/A"] },
        ticketId: "$u_id",
        contact: "$phone",
        bookingDate: `$createdAt`,
      },
    },
  );

  //
  let countQuery = {};
  if (search && search.trim() !== "") {
    countQuery = {
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phone" },
              regex: search,
              options: "i",
            },
          },
        },
        { u_id: { $regex: search, $options: "i" } },
      ],
    };
  }

  const [result, total] = await Promise.all([
    bookingModel.aggregate(pipeline),
    bookingModel.countDocuments(countQuery),
  ]);

  return sendSuccess(
    res,
    "success",
    {
      data: result,
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

// get single Booking
export const getSingleBookingDetails = catchAsync(async (req, res, next) => {
  const { id } = req?.params;
  if (!id) {
    return next(new AppError("Booking id missing", id));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Booking Id", 400));
  }
  const result = await bookingModel.aggregate([
    { $match: { _id: id } },
    {
      $lookup: {
        from: "events",
        let: { eventId: "$eventId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$eventId"] },
            },
          },
          {
            $project: {
              _id: 0,
              eventName: 1,
            },
          },
        ],
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: "$username",
        email: 1,
        tickets: "$totalTickets",
        eventName: { ifNull: ["$event.eventName", "N/A"] },
        ticketId: "$u_id",
        contact: "$phone",
      },
    },
  ]);
  console.log("sinngle", result);
  return sendSuccess(res, "success", result[0], 200, true);
});

// non-visit user
// export const nonVisitUser = catchAsync(async (req, res, next) => {
//   let { page = 1, limit = 10 } = req?.query;
//   const { search } = req?.query;

//   page = parseInt(page);
//   limit = parseInt(limit);
//   const skip = (page - 1) * limit;

//   const pipeline = [];

//   if (search && search.trim() !== "") {
//     pipeline.push({
//       $match: {
//         $or: [
//           { username: { $regex: search, $options: "i" } },
//           { email: { $regex: search, $options: "i" } },
//           {
//             $expr: {
//               $regexMatch: {
//                 input: { $toString: "$phone" },
//                 regex: search,
//                 options: "i",
//               },
//             },
//           },
//           { u_id: { $regex: search, $options: "i" } },
//         ],
//       },
//     });
//   }

//   pipeline.push(
//     { $match: { $expr: { $ne: ["$totalTicket", "$visitUsers"] } } },
//     { $sort: { createdAt: -1 } },
//     { $skip: skip },
//     { $limit: limit },

//     {
//       $lookup: {
//         from: "events",
//         let: { eventId: "$eventId" },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$_id", "$$eventId"] },
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               eventName: 1,
//             },
//           },
//         ],
//         as: "event",
//       },
//     },
//     {
//       $unwind: {
//         path: "$event",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $project: {
//         _id: 1,
//         name: { $ifNull: ["$username", "N/A"] },
//         email: 1,
//         tickets: "$totalTicket",
//         eventName: { $ifNull: ["$event.eventName", "N/A"] },
//         ticketId: "$u_id",
//         contact: "$phone",
//         bookingDate: `$createdAt`,
//         nonVisitedUser: { $subtract: ["$totalTicket", "$visitUsers"] },
//       },
//     },
//   );

//   //
//   let countQuery = {};
//   if (search && search.trim() !== "") {
//     countQuery = {
//       $or: [
//         { username: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         {
//           $expr: {
//             $regexMatch: {
//               input: { $toString: "$phone" },
//               regex: search,
//               options: "i",
//             },
//           },
//         },
//         { u_id: { $regex: search, $options: "i" } },
//       ],
//     };
//   }
//   countPipeline.push({
//     $match: {
//       $expr: {
//         $ne: ["$totalTicket", "$visitUsers"],
//       },
//     },
//   });

//   countPipeline.push({
//     $count: "total",
//   });
//   const [result, total] = await Promise.all([
//     bookingModel.aggregate(pipeline),
//     bookingModel.countDocuments(countQuery),
//   ]);
//   return res.json({ result, total });
// });

export const nonVisitUser = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  const { search } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;
  //  Common Match Query
  const matchQuery = {
    $expr: {
      $ne: ["$totalTicket", "$visitUsers"],
    },
  };
  //  Search Filter
  if (search && search.trim() !== "") {
    matchQuery.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$phone" },
            regex: search,
            options: "i",
          },
        },
      },
      { u_id: { $regex: search, $options: "i" } },
    ];
  }
  //  Main Pipeline
  const pipeline = [
    {
      $match: matchQuery,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "events",
        let: { eventId: "$eventId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$eventId"],
              },
            },
          },
          {
            $project: {
              _id: 0,
              eventName: 1,
            },
          },
        ],
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: {
          $ifNull: ["$username", "N/A"],
        },
        email: 1,
        tickets: "$totalTicket",
        visitUsers: {
          $ifNull: ["$visitUsers", 0],
        },
        nonVisitCount: {
          $subtract: [
            "$totalTicket",
            {
              $ifNull: ["$visitUsers", 0],
            },
          ],
        },
        eventName: {
          $ifNull: ["$event.eventName", "N/A"],
        },
        ticketId: "$u_id",
        contact: "$phone",
        bookingDate: "$createdAt",
      },
    },
  ];
  //  Total Count Pipeline
  const totalPipeline = [
    {
      $match: matchQuery,
    },
    {
      $count: "total",
    },
  ];
  //  Execute Queries
  const [result, totalResult] = await Promise.all([
    bookingModel.aggregate(pipeline),
    bookingModel.aggregate(totalPipeline),
  ]);
  const total = totalResult[0]?.total || 0;
  return sendSuccess(
    res,
    "success",
    {
      data: result,
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
