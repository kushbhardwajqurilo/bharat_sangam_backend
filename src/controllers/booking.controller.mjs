import crypto from "crypto";
import mongoose from "mongoose";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import bookingModel from "../models/bookingModel.js";
import eventModel from "../models/eventModel.js";
import Payment from "../models/payment.model.mjs";
import BookingReservation from "../models/bookingReserveModel.mjs";
import bookingTypeModel from "../models/bookingType.mjs";
import { ticketQueue } from "../queues/ticket.queue.mjs";
import {
  razorpayInstance,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
} from "../config/razorpay.config.mjs";

/**
 * STEP 1: Create Razorpay Order & Atomically Reserve Tickets
 * Endpoint: POST /api/v1/booking/create-order
 */
export const createBookingOrder = catchAsync(async (req, res, next) => {
  const { fullName, email, mobile, tickets, ticketType, eventId } = req.body;
  console.log({ body: req.body })
  const normalizedPhone = Number(mobile);

  // 1. Verify Razorpay environment
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return next(
      new AppError(
        "Razorpay credentials are not properly configured on server",
        500,
      ),
    );
  }

  // 2. Fetch Event & Validate
  const event = await eventModel.findById(eventId).populate("bookingType");
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  if (!event.isActive) {
    return next(new AppError("Event is currently inactive", 400));
  }

  // Check event end time
  if (event.endTime && event.date) {
    const [hours, minutes] = event.endTime.split(":");
    const eventEndDateTime = new Date(event.date);
    eventEndDateTime.setHours(Number(hours) || 23);
    eventEndDateTime.setMinutes(Number(minutes) || 59);
    eventEndDateTime.setSeconds(0);

    if (new Date() > eventEndDateTime) {
      return next(new AppError("Event booking has ended", 400));
    }
  }

  // 3. Verify user has not already booked this event
  const alreadyBooked = await bookingModel.findOne({
    eventId,
    phone: normalizedPhone,
  });
  if (alreadyBooked) {
    return next(
      new AppError(
        "This phone number has already been used for booking this event",
        400,
      ),
    );
  }

  // 4. Resolve Ticket Price Server-Side
  let unitPrice = 0;
  let matchedType = null;
  const targetType = String(ticketType).trim().toLowerCase();

  // Search populated event bookingTypes
  if (Array.isArray(event.bookingType) && event.bookingType.length > 0) {
    matchedType = event.bookingType.find((bt) => {
      if (!bt) return false;
      const typeStr = typeof bt === "object" ? (bt.bookingType || bt.name || bt.subtitle || "") : String(bt);
      const typeId = typeof bt === "object" && bt._id ? bt._id.toString() : "";
      return (
        typeStr.toLowerCase() === targetType ||
        typeId === ticketType ||
        typeStr.toLowerCase().replace(/\s+/g, "") === targetType.replace(/\s+/g, "")
      );
    });

    if (matchedType && typeof matchedType === "object" && matchedType.price !== undefined) {
      unitPrice = Number(matchedType.price);
    }
  }

  // Fallback: Query bookingTypeModel directly (case-insensitive)
  if (unitPrice === 0 || !matchedType) {
    const dbBookingType = await bookingTypeModel.findOne({
      $or: [
        { bookingType: { $regex: new RegExp(`^${ticketType.trim()}$`, "i") } },
        { subtitle: { $regex: new RegExp(`^${ticketType.trim()}$`, "i") } },
        ...(mongoose.Types.ObjectId.isValid(ticketType)
          ? [{ _id: new mongoose.Types.ObjectId(ticketType) }]
          : []),
      ],
    });

    if (dbBookingType) {
      unitPrice = Number(dbBookingType.price);
      matchedType = dbBookingType;
    }
  }

  const finalUnitPrice = Number(unitPrice) || 0;
  const totalAmountPaise = Math.round(finalUnitPrice * tickets * 100);

  if (totalAmountPaise <= 0) {
    console.warn("⚠️ Price lookup failed for:", {
      ticketType,
      targetType,
      eventBookingTypes: event.bookingType,
      unitPrice,
    });
    return next(
      new AppError(
        `Invalid ticket price calculated for ticket type "${ticketType}". Please ensure this ticket type exists and has a price > 0.`,
        400,
      ),
    );
  }

  // 5. Check if user already holds an active, valid reservation for this event & phone
  let reservation = await BookingReservation.findOne({
    eventId,
    phone: normalizedPhone,
    status: "reserved",
    expiresAt: { $gt: new Date() },
  });

  if (reservation) {
    // If ticket count differs, release old seats and decrement new seats atomically
    if (reservation.totalTicket !== tickets) {
      const diff = tickets - reservation.totalTicket;
      const updatedEvent = await eventModel.findOneAndUpdate(
        {
          _id: eventId,
          isActive: true,
          availableTickets: { $gte: diff },
        },
        {
          $inc: {
            availableTickets: -diff,
            bookedSeats: diff,
          },
        },
        { new: true },
      );

      if (!updatedEvent) {
        return next(
          new AppError(
            "Cannot update reservation: not enough seats available",
            400,
          ),
        );
      }

      reservation.totalTicket = tickets;
      reservation.ticketType = ticketType;
      reservation.username = fullName;
      reservation.email = email;
      reservation.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // refresh 10 min
      await reservation.save();
    }
  } else {
    // 6. Atomically check and decrement seats
    const updatedEvent = await eventModel.findOneAndUpdate(
      {
        _id: eventId,
        isActive: true,
        availableTickets: { $gte: tickets },
      },
      {
        $inc: {
          availableTickets: -tickets,
          bookedSeats: tickets,
        },
      },
      { new: true },
    );

    if (!updatedEvent) {
      return next(new AppError("Tickets sold out", 400));
    }

    // 7. Create new Reservation (10 minutes TTL)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    reservation = await BookingReservation.create({
      eventId,
      username: fullName,
      email,
      phone: normalizedPhone,
      totalTicket: tickets,
      ticketType,
      expiresAt,
      status: "reserved",
    });
  }

  // 8. Generate receipt and Create Razorpay Order
  const receipt = `rcpt_${reservation._id.toString().slice(-8)}_${Date.now().toString().slice(-4)}`;
  let razorpayOrder;

  try {
    razorpayOrder = await razorpayInstance.orders.create({
      amount: totalAmountPaise,
      currency: "INR",
      receipt,
      notes: {
        reservationId: reservation._id.toString(),
        eventId: eventId.toString(),
        phone: String(normalizedPhone),
        tickets: String(tickets),
        ticketType: String(ticketType),
      },
    });
  } catch (rzpError) {
    // If Razorpay order creation fails, roll back reservation & seats
    await BookingReservation.updateOne(
      { _id: reservation._id },
      { $set: { status: "released" } },
    );
    await eventModel.updateOne(
      { _id: eventId },
      {
        $inc: {
          availableTickets: tickets,
          bookedSeats: -tickets,
        },
      },
    );
    return next(
      new AppError(
        `Failed to create Razorpay Order: ${rzpError.message || rzpError.description}`,
        500,
      ),
    );
  }

  // 9. Update Reservation with orderId
  reservation.orderId = razorpayOrder.id;
  await reservation.save();

  // 10. Record initial Payment entry (status: created)
  await Payment.findOneAndUpdate(
    { orderId: razorpayOrder.id },
    {
      $set: {
        orderId: razorpayOrder.id,
        eventId,
        amount: totalAmountPaise,
        currency: "INR",
        receipt: razorpayOrder.receipt || receipt,
        status: "created",
        phone: normalizedPhone,
        email,
        notes: razorpayOrder.notes || {},
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return sendSuccess(
    res,
    "Order created successfully",
    {
      orderId: razorpayOrder.id,
      keyId: RAZORPAY_KEY_ID,
      amount: totalAmountPaise,
      currency: "INR",
      eventName: event.eventName,
      ticketType,
      tickets,
      reservationId: reservation._id.toString(),
      expiresAt: reservation.expiresAt,
    },
    201,
    true,
  );
});

/**
 * STEP 2: Verify Razorpay Signature, Payment Authenticity, & Issue Ticket
 * Endpoint: POST /api/v1/booking/verify-and-create-ticket
 */
export const verifyAndCreateTicket = catchAsync(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    reservationId,
  } = req.body;

  if (!RAZORPAY_KEY_SECRET) {
    return next(
      new AppError("Razorpay secret not configured on backend", 500),
    );
  }

  // 1. Cryptographic HMAC-SHA256 Signature Verification
  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isSignatureValid =
    generatedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "utf8"),
      Buffer.from(razorpay_signature, "utf8"),
    );

  if (!isSignatureValid) {
    return next(
      new AppError("Invalid payment signature. Verification failed.", 400),
    );
  }

  // 2. Fetch Order & Payment from Razorpay API for independent verification
  let rzpOrder;
  let rzpPayment;

  try {
    [rzpOrder, rzpPayment] = await Promise.all([
      razorpayInstance.orders.fetch(razorpay_order_id),
      razorpayInstance.payments.fetch(razorpay_payment_id),
    ]);
  } catch (fetchErr) {
    return next(
      new AppError(
        `Failed to verify payment with Razorpay: ${fetchErr.message}`,
        400,
      ),
    );
  }

  if (!rzpPayment || !["captured", "authorized"].includes(rzpPayment.status)) {
    return next(
      new AppError(
        `Payment is not in a valid paid state (Status: ${rzpPayment?.status})`,
        400,
      ),
    );
  }

  if (rzpPayment.order_id !== razorpay_order_id) {
    return next(
      new AppError("Payment does not belong to the specified order", 400),
    );
  }

  // 3. Database Transaction for Durability & Idempotency
  const session = await mongoose.startSession();
  let ticket;

  try {
    session.startTransaction();

    // Idempotency: If this payment or order was already processed, return existing ticket
    const existingPayment = await Payment.findOne({
      $or: [{ orderId: razorpay_order_id }, { paymentId: razorpay_payment_id }],
    }).session(session);

    if (existingPayment?.bookingId && existingPayment.status === "paid") {
      ticket = await bookingModel
        .findById(existingPayment.bookingId)
        .session(session);

      await session.commitTransaction();
      await session.endSession();

      return sendSuccess(
        res,
        "Ticket already created",
        {
          bookingId: ticket?.u_id,
          url: ticket?.url || "",
        },
        200,
        true,
      );
    }

    // Validate Reservation
    const reservation = await BookingReservation.findOne({
      _id: reservationId,
      status: "reserved",
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (!reservation) {
      throw new AppError(
        "Reservation has expired or is invalid. Please contact support.",
        400,
      );
    }

    // Check duplicate booking by phone for this event
    const alreadyBooked = await bookingModel
      .findOne({
        eventId: reservation.eventId,
        phone: reservation.phone,
      })
      .session(session);

    if (alreadyBooked) {
      throw new AppError(
        "This phone number has already been used for booking this event.",
        400,
      );
    }

    // Generate unique BBS booking ID
    const u_id = `BBS${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Booking Document (Do NOT decrement inventory here - reservation already holds it!)
    [ticket] = await bookingModel.create(
      [
        {
          username: reservation.username,
          email: reservation.email,
          eventId: reservation.eventId,
          u_id,
          totalTicket: reservation.totalTicket,
          amount: (rzpPayment.amount || 0) / 100, // convert paise to rupees
          allowVisitors: reservation.totalTicket,
          visitUsers: 0,
          phone: reservation.phone,
          paymentStatus: "success",
        },
      ],
      { session },
    );

    // Upsert Payment Record
    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        $set: {
          eventId: reservation.eventId,
          paymentId: razorpay_payment_id,
          amount: rzpPayment.amount,
          currency: rzpPayment.currency || "INR",
          receipt: rzpOrder.receipt || `rcpt_${reservation._id.toString()}`,
          status: "paid",
          phone: reservation.phone,
          email: reservation.email,
          method: rzpPayment.method,
          razorpaySignature: razorpay_signature,
          paidAt: rzpPayment.created_at
            ? new Date(rzpPayment.created_at * 1000)
            : new Date(),
          bookingId: ticket._id,
          notes: rzpOrder.notes || {},
        },
      },
      { upsert: true, new: true, session },
    );

    // Mark Reservation as Confirmed
    await BookingReservation.updateOne(
      { _id: reservation._id, status: "reserved" },
      {
        $set: {
          status: "confirmed",
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          bookingId: ticket._id,
        },
      },
      { session },
    );

    // Commit Transaction
    await session.commitTransaction();
    await session.endSession();
  } catch (txError) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    return next(txError);
  }

  // 4. Enqueue Ticket Worker Job (Email + WhatsApp Generation)
  try {
    await ticketQueue.add("generateTicket", {
      ticketId: ticket._id.toString(),
      username: ticket.username,
      email: ticket.email,
      phone: ticket.phone,
      u_id: ticket.u_id,
      allowVisitors: ticket.allowVisitors,
    });
  } catch (queueErr) {
    console.error("⚠️ Failed to enqueue ticket generation worker:", queueErr);
  }

  return sendSuccess(
    res,
    "Ticket created successfully 🎉",
    {
      bookingId: ticket.u_id,
      tickets: ticket.totalTicket,
      email: ticket.email,
      phone: ticket.phone,
    },
    200,
    true,
  );
});

// Legacy / Direct ticket creation endpoint (backward compatibility)
export const createTicket = catchAsync(async (req, res, next) => {
  const latestEvent = await eventModel.findOne().sort({ createdAt: -1 });
  if (!latestEvent) {
    return res.status(404).json({ success: false, message: "No event found" });
  }

  const { username, email, eventId, totalTicket, phone } = req.body;

  const isAlreadyBooked = await bookingModel
    .findOne({ eventId: eventId, phone: phone })
    .sort({ createdAt: -1 });

  if (isAlreadyBooked) {
    return next(
      new AppError(
        "This number has already been used for booking tickets",
        400,
      ),
    );
  }

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

  try {
    await ticketQueue.add("generateTicket", {
      ticketId: ticket._id,
      username,
      email,
      phone: Number(phone),
      u_id,
      allowVisitors: totalTicket,
    });
  } catch (err) {
    console.error("Queue failed", err);
  }

  res.status(200).json({
    success: true,
    message: "Ticket created 🎉",
    bookingId: u_id,
  });
});

// Ticket details by QR scan
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

// Verify Ticket on Venue Entry
export const verifyTicket = catchAsync(async (req, res, next) => {
  const { u_id } = req.query;
  const { allow_user } = req.body;

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

    if (ticket.isUsed) {
      return next(new AppError("Ticket already used", 400));
    }

    if (ticket.allowVisitors <= 0 || ticket.totalTicket === ticket.visitUsers) {
      ticket.isUsed = true;
      await ticket.save();
      return next(new AppError("All visitors already verified", 400));
    }

    if (visitorsComing > ticket.allowVisitors) {
      return next(
        new AppError(
          `Only ${ticket.allowVisitors} visitors allowed, but received ${visitorsComing}`,
          400,
        ),
      );
    }

    ticket.allowVisitors -= visitorsComing;
    ticket.visitUsers += visitorsComing;

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

// Get ticket details by phone number
export const getTicketDetailsByPhone = catchAsync(async (req, res, next) => {
  const { phone } = req.query;
  if (!phone) {
    return next(new AppError("Phone number required"), 400);
  }
  const cleaned = phone.replace(/^(\+91|91)/, "").replace(/\D/g, "");

  if (cleaned.length !== 10) {
    throw new Error("Invalid phone number");
  }

  const event = await eventModel
    .findOne({})
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();

  const ticket = await bookingModel
    .findOne({ phone: cleaned, eventId: event?._id })
    .sort({ createdAt: -1 });

  if (!ticket) {
    return sendSuccess(res, "Ticket not found", {}, 200, true);
  }
  return sendSuccess(res, "success", ticket, 200, true);
});

// Admin Get all bookings
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

// Admin Get Single Booking
export const getSingleBookingDetails = catchAsync(async (req, res, next) => {
  const { id } = req?.params;
  if (!id) {
    return next(new AppError("Booking id missing", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Booking Id", 400));
  }
  const result = await bookingModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
        tickets: "$totalTicket",
        eventName: { $ifNull: ["$event.eventName", "N/A"] },
        ticketId: "$u_id",
        contact: "$phone",
      },
    },
  ]);

  if (!result || !result.length) {
    return next(new AppError("Booking not found", 404));
  }

  return sendSuccess(res, "success", result[0], 200, true);
});

// Non visit users
export const nonVisitUser = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  const { search } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const matchQuery = {
    $expr: {
      $ne: ["$totalTicket", "$visitUsers"],
    },
  };

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

  const pipeline = [
    { $match: matchQuery },
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
        visitUsers: { $ifNull: ["$visitUsers", 0] },
        nonVisitCount: {
          $subtract: ["$totalTicket", { $ifNull: ["$visitUsers", 0] }],
        },
        eventName: { $ifNull: ["$event.eventName", "N/A"] },
        ticketId: "$u_id",
        contact: "$phone",
        bookingDate: "$createdAt",
      },
    },
  ];

  const totalPipeline = [{ $match: matchQuery }, { $count: "total" }];

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
