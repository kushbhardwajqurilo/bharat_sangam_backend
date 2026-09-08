import cron from "node-cron";
import BookingReservation from "../models/bookingReserveModel.mjs";
import eventModel from "../models/eventModel.js";
import mongoose from "mongoose";

/**
 * Periodically release expired unpaid reservations back to event capacity
 */
export const releaseExpiredReservations = async () => {
  try {
    const expiredReservations = await BookingReservation.find({
      status: "reserved",
      expiresAt: { $lte: new Date() },
    }).limit(100);

    if (!expiredReservations.length) {
      return;
    }

    console.log(`⏱️ Releasing ${expiredReservations.length} expired reservations...`);

    for (const reservation of expiredReservations) {
      // Mark expired
      const updated = await BookingReservation.updateOne(
        { _id: reservation._id, status: "reserved" },
        { $set: { status: "expired" } },
      );

      // If successfully updated, return seats atomically to event
      if (updated.modifiedCount === 1) {
        await eventModel.updateOne(
          { _id: reservation.eventId },
          {
            $inc: {
              availableTickets: reservation.totalTicket,
              bookedSeats: -reservation.totalTicket,
            },
          },
        );
        console.log(
          `✅ Returned ${reservation.totalTicket} seats for event ${reservation.eventId} (Reservation ${reservation._id})`,
        );
      }
    }
  } catch (error) {
    console.error("❌ Error releasing expired reservations:", error);
  }
};

const startCronJobs = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    await releaseExpiredReservations();
  });
  console.log("⏰ Reservation expiration cron job scheduled (every minute)");
};

export default startCronJobs;
