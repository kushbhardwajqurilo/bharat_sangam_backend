import eventModel from "../models/eventModel";

export const bookTickets = async (eventId, count) => {
  const event = await eventModel.findOneAndUpdate(
    {
      _id: eventId,
      isActive: true,
      $expr: {
        $gte: [{ $subtract: ["$totalTickets", "$soldTickets"] }, count],
      },
    },
    {
      $inc: { soldTickets: count },
    },
    { new: true },
  );

  if (!event) {
    throw new Error("Tickets not available");
  }

  return event;
};
