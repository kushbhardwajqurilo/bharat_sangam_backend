// import dotenv from "dotenv";
// import mongoose, { mongo } from "mongoose";
// import QRCode from "qrcode";
// import puppeteer from "puppeteer";
// import { generateTicketHTML } from "../utils/ticketTemplate.mjs";
// import { redisConnection } from "../config/redis.mjs";
// import bookingModel from "../models/bookingModel.js";
// import { sendTicketEmail } from "../config/mail.config.mjs";
// import { Worker } from "bullmq";
// import connectDB from "../config/databse.mjs";
// import { sendTicketEmailFromBravo } from "../config/bravoConfig.mjs";
// import sendWhatsAppTemplate from "../whatsapp/ticket.whatsappTemplate.mjs";
// import uploadBufferToCloudinary from "../utils/uploadBufferInCloudinary.mjs";
// dotenv.config();

// console.log("🚀 Worker file loaded...");
// await mongoose.connect(process.env.DB_URI, {
//   serverSelectionTimeoutMS: 30000,
// });
// console.log("worker db connected");
// let browser;

// function formatWhatsAppNumber(phone) {
//   if (!phone) return null;

//   const digits = String(phone).replace(/\D/g, "");

//   if (!digits) return null;
//   if (digits.length === 10) return `+91${digits}`;
//   if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;

//   return `+${digits}`;
// }

// const worker = new Worker(
//   "ticketQueue",
//   async (job) => {
//     console.log(" JOB RECEIVED:");
//     const { ticketId, email, u_id, allowVisitors, username, phone } = job.data;
//     console.log(" Worker started...");
//     const genTicket = await bookingModel.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(ticketId) } },

//       // 🔹 Event Details (only selected fields)
//       {
//         $lookup: {
//           from: "events",
//           let: { eventId: "$eventId" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$_id", "$$eventId"] } } },
//             {
//               $project: {
//                 eventName: 1,
//                 date: 1,
//                 startTime: 1,
//                 endTime: 1,
//                 venueName: 1,
//                 artists: 1,
//               },
//             },
//           ],
//           as: "eventDetails",
//         },
//       },
//       { $unwind: "$eventDetails" },

//       // 🔹 Artist Details (only specific fields)
//       {
//         $lookup: {
//           from: "artists",
//           let: { artistIds: "$eventDetails.artists" },
//           pipeline: [
//             { $match: { $expr: { $in: ["$_id", "$$artistIds"] } } },
//             {
//               $project: {
//                 artistName: 1,
//                 profileImage: 1,
//                 about: 1,
//               },
//             },
//           ],
//           as: "artistDetails",
//         },
//       },

//       // 🔹 Venue Details (only specific fields)
//       {
//         $lookup: {
//           from: "venues",
//           let: { venueId: "$eventDetails.venueName" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$_id", "$$venueId"] } } },
//             {
//               $project: {
//                 venue: 1,
//                 address: 1,
//                 image: 1,
//               },
//             },
//           ],
//           as: "venueDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$venueDetails",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//     ]);

//     const finalTicket = genTicket[0];
//     // console.log("final", finalTicket);
//     const logoUrl = "https://bbsapi.qurilo.com/logo.png";
//     const qr = await QRCode.toDataURL(u_id);
//     const date = new Date(finalTicket?.eventDetails?.date);

//     const formatted = date.toLocaleDateString("en-IN");
//     const html = generateTicketHTML({
//       name: username,
//       logo: logoUrl,
//       eventName: finalTicket?.eventDetails?.eventName,
//       poster: `${finalTicket?.venueDetails?.image}`,
//       time: `${finalTicket?.eventDetails?.startTime} To ${finalTicket?.eventDetails?.endTime}`,
//       qr,
//       u_id,
//       visitors: allowVisitors,
//       artistImage: finalTicket?.artistDetails[0].profileImage,
//       artistName: finalTicket?.artistDetails[0].artistName,
//       artistDesc: finalTicket?.artistDetails[0].about,
//       location: finalTicket?.venueDetails?.venue,
//       date: formatted,
//       venue: finalTicket?.venueDetails?.address,
//     });

//     //  Reuse browser
//     if (!browser) {
//       browser = await puppeteer.launch({
//         headless: true,
//         args: ["--no-sandbox"],
//       });
//     }

//     const page = await browser.newPage();

//     await page.setViewport({
//       width: 1200,
//       height: 1800,
//       deviceScaleFactor: 3, // 🔥 key for HD
//     });

//     await page.setContent(html, { waitUntil: "networkidle0" });

//     const element = await page.$(".ticket");
//     const boundingBox = await element.boundingBox();

//     const buffer = await page.screenshot({
//       type: "png",
//       clip: boundingBox,
//     });

//     await page.close();
//     const uploadImage = await uploadBufferToCloudinary(buffer);
//     const whatsappRecipient = formatWhatsAppNumber(phone ?? finalTicket?.phone);
//     // const emailVal = await sendTicketEmail(email, buffer, u_id);
//     const emailVal = await sendTicketEmailFromBravo(
//       email,
//       buffer,
//       u_id,
//       {
//         eventName: finalTicket?.eventDetails?.eventName,
//         venue: finalTicket?.venueDetails?.address,
//         date: formatted,
//         time: finalTicket?.eventDetails?.time,
//       },
//       username,
//     );

//     if (!whatsappRecipient) {
//       console.warn(`WhatsApp skipped: missing phone for ticket ${u_id}`);
//     } else {
//       const sentTicketInWhatsapp = await sendWhatsAppTemplate({
//         to: whatsappRecipient,
//         from: process.env.WHATSAPP_NUMBER,
//         authorization: process.env.WHATSAPP_TICKET_KEY,
//         placeholders: [
//           username,
//           finalTicket?.eventDetails?.eventName,
//           finalTicket?.venueDetails?.address,
//           formatted,
//           `${finalTicket?.eventDetails?.startTime} To ${finalTicket?.eventDetails?.endTime}`,
//           allowVisitors,
//           u_id,
//         ],
//         mediaUrl: uploadImage?.secure_url,
//         filename: `ticket-${u_id}.png`,
//       });

//       console.log("WhatsApp enqueue response:", sentTicketInWhatsapp);
//     }
//     // console.log("emailVal", emailVal);
//   },
//   { connection: redisConnection },
// );

// console.log("👂 Worker listening...");

// // 🔥 EVENTS (YAHAN LIKHNA HAI — WORKER KE BAAD)
// worker.on("ready", () => {
//   console.log("✅ Worker is ready and listening...");
// });

// worker.on("active", (job) => {
//   console.log("⚡ Job active:", job.id);
// });

// worker.on("completed", (job) => {
//   console.log("✅ Job completed:", job.id);
// });

// worker.on("failed", (job, err) => {
//   console.error("❌ Job failed:", err);
// });

// worker.on("error", (err) => {
//   console.error("❌ Worker error:", err);
// });

import dotenv from "dotenv";
import mongoose from "mongoose";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import { generateTicketHTML } from "../utils/ticketTemplate.mjs";
import { redisConnection } from "../config/redis.mjs";
import bookingModel from "../models/bookingModel.js";
import { Worker } from "bullmq";
import { sendTicketEmailFromBravo } from "../config/bravoConfig.mjs";
import sendWhatsAppTemplate from "../whatsapp/ticket.whatsappTemplate.mjs";
import uploadBufferToCloudinary from "../utils/uploadBufferInCloudinary.mjs";
dotenv.config();

console.log("🚀 Worker file loaded...");
await mongoose.connect(process.env.DB_URI, {
  serverSelectionTimeoutMS: 30000,
});
console.log("worker db connected");

let browser;

function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

const worker = new Worker(
  "ticketQueue",
  async (job) => {
    console.log("📦 JOB RECEIVED:", job.id);
    const { ticketId, email, u_id, allowVisitors, username, phone } = job.data;

    // ── 1. Fetch ticket data ──────────────────────────────────────────────────
    const genTicket = await bookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(ticketId) } },

      // Event details
      {
        $lookup: {
          from: "events",
          let: { eventId: "$eventId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$eventId"] } } },
            {
              $project: {
                eventName: 1,
                date: 1,
                startTime: 1,
                endTime: 1,
                venueName: 1,
                artists: 1,
              },
            },
          ],
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },

      // Artist details
      {
        $lookup: {
          from: "artists",
          let: { artistIds: "$eventDetails.artists" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$artistIds"] } } },
            {
              $project: { artistName: 1, profileImage: 1, about: 1 },
            },
          ],
          as: "artistDetails",
        },
      },

      // Venue details — also project `phone` from the booking itself
      {
        $lookup: {
          from: "venues",
          let: { venueId: "$eventDetails.venueName" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$venueId"] } } },
            { $project: { venue: 1, address: 1, image: 1 } },
          ],
          as: "venueDetails",
        },
      },
      { $unwind: { path: "$venueDetails", preserveNullAndEmptyArrays: true } },

      // ✅ FIX 1: project `phone` from the booking document itself
      {
        $addFields: {
          bookingPhone: "$phone",
        },
      },
    ]);

    const finalTicket = genTicket[0];

    if (!finalTicket) {
      throw new Error(`No booking found for ticketId: ${ticketId}`);
    }

    // ── 2. Build HTML & screenshot ────────────────────────────────────────────
    const logoUrl = "https://bbsapi.qurilo.com/logo.png";
    const qr = await QRCode.toDataURL(u_id);
    const date = new Date(finalTicket?.eventDetails?.date);
    const formatted = date.toLocaleDateString("en-IN");

    const html = generateTicketHTML({
      name: username,
      logo: logoUrl,
      eventName: finalTicket?.eventDetails?.eventName,
      poster: finalTicket?.venueDetails?.image,
      time: `${finalTicket?.eventDetails?.startTime} To ${finalTicket?.eventDetails?.endTime}`,
      qr,
      u_id,
      visitors: allowVisitors,
      artistImage: finalTicket?.artistDetails?.[0]?.profileImage,
      artistName: finalTicket?.artistDetails?.[0]?.artistName,
      artistDesc: finalTicket?.artistDetails?.[0]?.about,
      location: finalTicket?.venueDetails?.venue,
      date: formatted,
      venue: finalTicket?.venueDetails?.address,
    });

    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1800, deviceScaleFactor: 3 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const element = await page.$(".ticket");
    const boundingBox = await element.boundingBox();
    const buffer = await page.screenshot({ type: "png", clip: boundingBox });
    await page.close();

    // ── 3. Upload ticket image to Cloudinary ──────────────────────────────────
    const uploadImage = await uploadBufferToCloudinary(buffer);

    // ✅ FIX 2: guard against Cloudinary failure before continuing
    if (!uploadImage?.secure_url) {
      throw new Error(
        `Cloudinary upload failed for ticket ${u_id} — cannot proceed`,
      );
    }

    // ── 4. Send email ─────────────────────────────────────────────────────────
    await sendTicketEmailFromBravo(
      email,
      buffer,
      u_id,
      {
        eventName: finalTicket?.eventDetails?.eventName,
        venue: finalTicket?.venueDetails?.address,
        date: formatted,
        // ✅ FIX 3: was `eventDetails.time` which doesn't exist
        time: `${finalTicket?.eventDetails?.startTime} To ${finalTicket?.eventDetails?.endTime}`,
      },
      username,
    );

    // ── 5. Send WhatsApp ──────────────────────────────────────────────────────
    // ✅ FIX 1: fall back to bookingPhone (projected via $addFields above)
    const whatsappRecipient = formatWhatsAppNumber(
      phone ?? finalTicket?.bookingPhone,
    );

    console.log("📱 WhatsApp recipient:", whatsappRecipient);
    console.log("🖼️  Media URL:", uploadImage.secure_url);

    if (!whatsappRecipient) {
      console.warn(`⚠️ WhatsApp skipped: no phone found for ticket ${u_id}`);
    } else {
      const placeholders = [
        username,
        finalTicket?.eventDetails?.eventName,
        finalTicket?.venueDetails?.address,
        formatted,
        `${finalTicket?.eventDetails?.startTime} To ${finalTicket?.eventDetails?.endTime}`,
        //  FIX 4: all placeholders must be strings
        String(allowVisitors ?? "0"),
        u_id,
      ];

      const sentTicketInWhatsapp = await sendWhatsAppTemplate({
        to: whatsappRecipient,
        from: process.env.WHATSAPP_NUMBER,
        authorization: process.env.WHATSAPP_TICKET_KEY,
        placeholders,
        mediaUrl: uploadImage.secure_url,
        filename: `ticket-${u_id}.png`,
      });

      // console.log("✅ WhatsApp enqueue response:", sentTicketInWhatsapp);
    }
    const setBookignTicketUrl = await bookingModel.findOneAndUpdate(
      { u_id: u_id },
      { $set: { url: uploadImage?.secure_url } },
    );
  },
  { connection: redisConnection },
);

console.log("👂 Worker listening...");

worker.on("ready", () => console.log("✅ Worker is ready and listening..."));
worker.on("active", (job) => console.log("⚡ Job active:", job.id));
worker.on("completed", (job) => console.log("✅ Job completed:", job.id));
worker.on("failed", (job, err) =>
  console.error("❌ Job failed:", job.id, err.message),
);
worker.on("error", (err) => console.error("❌ Worker error:", err));
