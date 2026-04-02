import { bookTickets } from "../services/event.service.mjs";

export const bookEventTickets = catchAsync(async (req, res, next) => {
  const { eventId, count } = req.body;

  if (!eventId || !count) {
    return next(new AppError("EventId and ticket count required", 400));
  }

  const event = await bookTickets(eventId, count);

  return sendSuccess(res, "Tickets booked successfully", event, 200);
});
