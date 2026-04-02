import eventModel from "../models/event.model.js";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

// ================= CREATE EVENT =================
export const createEvent = catchAsync(async (req, res, next) => {
  const { eventName, description, eventTiming, instrument, totalTickets } =
    req.body;

  if (!eventName || !description || !eventTiming || !totalTickets) {
    return next(new AppError("All required fields must be provided", 400));
  }

  const event = await eventModel.create({
    eventName,
    description,
    eventTiming,
    instrument,
    totalTickets,
  });

  return sendSuccess(res, "Event created successfully", event, 201);
});

// ================= GET ALL EVENTS =================
export const getAllEvents = catchAsync(async (req, res, next) => {
  const events = await eventModel.find().sort({ createdAt: -1 });

  return sendSuccess(res, "All events fetched", events, 200);
});

// ================= GET SINGLE EVENT =================
export const getSingleEvent = catchAsync(async (req, res, next) => {
  const event = await eventModel.findById(req.params.id).lean();

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event fetched", event, 200);
});
// ================= UPDATE EVENT =================
export const updateEvent = catchAsync(async (req, res, next) => {
  const allowedFields = [
    "eventName",
    "description",
    "eventTiming",
    "instrument",
    "totalTickets",
    "isActive",
  ];

  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const event = await eventModel.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event updated", event, 200);
});

// ================= DELETE EVENT =================
export const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await eventModel.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  return sendSuccess(res, "Event deleted", {}, 200);
});
