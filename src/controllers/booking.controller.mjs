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
  const { username, email, eventId, totalTicket, phone } = req.body;

  // console.log("🟢 STEP 1: API HIT");

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
      u_id,
      allowVisitors: totalTicket,
    });

    // console.log("✅ STEP 4: JOB ADDED SUCCESS:", job.id);
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
    if (ticket.allowVisitors <= 0) {
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
