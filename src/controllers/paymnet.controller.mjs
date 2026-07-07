import Payment from "../models/payment.model.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const dashboardTotalEventPayment = async (req, res, next) => {};

export const getAllPaymentDetails = catchAsync(async (req, res, next) => {
  const queryData = req.validatedQuery;
  const { page, limit, eventId, bookingId, status, email, phone, search } = queryData;

  const filter = {};
  if (eventId) filter.eventId = eventId;
  if (bookingId) filter.bookingId = bookingId;
  if (status) filter.status = status;
  if (email) filter.email = email;
  if (phone) filter.phone = phone;

  if (search) {
    const searchRegex = new RegExp(search, "i");
    filter.$or = [
      { orderId: searchRegex },
      { paymentId: searchRegex },
      { email: searchRegex },
      { method: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .populate("eventId")
    .populate("bookingId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return sendSuccess(res, "Payments retrieved successfully", {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getSinglePaymentDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("eventId")
    .populate("bookingId");

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  return sendSuccess(res, "Payment details retrieved successfully", payment);
});
