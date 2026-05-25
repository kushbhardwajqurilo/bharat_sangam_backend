import cron from "node-cron";
import bookingReserveModel from "../models/bookingReserveModel.mjs";
import mongoose from "mongoose";
import eventModel from "../models/eventModel.js";

// export async function releaseExpiredReservations() {
//   const session = await mongoose.startSession();

//   try {
//     await session.withTransaction(async () => {
//       const expiredReservations = await bookingReserveModel
//         .find({
//           status: "reserved",
//           expiresAt: { $lte: new Date() },
//         })
//         .limit(100)
//         .session(session);

//       for (const reservation of expiredReservations) {
//         const updated = await bookingReserveModel.updateOne(
//           { _id: reservation._id, status: "reserved" },
//           { $set: { status: "expired" } },
//           { session },
//         );

//         if (updated.modifiedCount !== 1) continue;

//         await eventModel.updateOne(
//           { _id: reservation.eventId },
//           {
//             $inc: {
//               availableTickets: reservation.totalTicket,
//               bookedSeats: -reservation.totalTicket,
//             },
//           },
//           { session },
//         );
//       }
//     });
//   } finally {
//     await session.endSession();
//   }
// }

const startCronJobs = () => {
  cron.schedule("* * * * *", async () => {
    console.log(" Cron running", new Date());

    try {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const expiredReservations = await bookingReserveModel
            .find({
              status: "reserved",
              expiresAt: { $lte: new Date() },
            })
            .limit(100)
            .session(session);
          for (const reservation of expiredReservations) {
            const updated = await bookingReserveModel.updateOne(
              { _id: reservation._id, status: "reserved" },
              { $set: { status: "expired" } },
              { session },
            );

            if (updated.modifiedCount !== 1) continue;

            await eventModel.updateOne(
              { _id: reservation.eventId },
              {
                $inc: {
                  availableTickets: reservation.totalTicket,
                  bookedSeats: -reservation.totalTicket,
                },
              },
              { session },
            );
          }
        });
      } finally {
        await session.endSession();
      }

      console.log("✅ Cron completed");
    } catch (error) {
      console.error("❌ Cron Error:", error);
    }
  });
};

export default startCronJobs;
