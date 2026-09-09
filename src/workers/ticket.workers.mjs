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
import redisConnection from "../config/redis.mjs";
import bookingModel from "../models/bookingModel.js";
import { Worker } from "bullmq";
import { sendTicketEmailFromBravo } from "../config/bravoConfig.mjs";
import sendWhatsAppTemplate from "../whatsapp/ticket.whatsappTemplate.mjs";
import uploadBufferToCloudinary from "../utils/uploadBufferInCloudinary.mjs";
dotenv.config();

const dbUri = process.env.NODE_ENV === "production"
  ? process.env.DB_URI
  : (process.env.TEST_DB_URI || process.env.DB_URI);

console.log("🚀 Worker file loaded...");
await mongoose.connect(dbUri, {
  serverSelectionTimeoutMS: 30000,
});
console.log("worker db connected to:", dbUri.split("@").pop() || "MongoDB");

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
    // console.log("ticket data", job.data);
    console.log("📦 JOB RECEIVED:", job.id);
    const { ticketId, email, u_id, allowVisitors, username, phone } = job.data;

    // ── 1. Fetch ticket data ──────────────────────────────────────────────────
    let genTicket = await bookingModel.aggregate([
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
      { $unwind: { path: "$eventDetails", preserveNullAndEmptyArrays: true } },

      // Artist details
      {
        $lookup: {
          from: "artists",
          let: { artistIds: { $ifNull: ["$eventDetails.artists", []] } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$artistIds"] },
                    { $eq: ["$status", "approved"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
            {
              $project: {
                artistName: 1,
                profileImage: 1,
                about: { $ifNull: ["$aboutArtist", "$about"] },
              },
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

      // Project phone from booking
      {
        $addFields: {
          bookingPhone: "$phone",
        },
      },
    ]);

    let finalTicket = genTicket[0];

    // Fallback: If aggregate failed, query bookingModel directly
    if (!finalTicket) {
      const rawBooking = await bookingModel.findById(ticketId).lean();
      if (!rawBooking) {
        throw new Error(`No booking found in database for ticketId: ${ticketId}`);
      }
      finalTicket = {
        ...rawBooking,
        bookingPhone: rawBooking.phone,
        eventDetails: {},
        artistDetails: [],
        venueDetails: {},
      };
    }
    const getBase64 = async (url) => {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return `data:image/png;base64,${base64}`;
    };

    const logoBase64 = await getBase64("https://bbsapi.qurilo.com/logo.png");

    // date conversion

    const formatDate = (isoDate) => {
      const date = new Date(isoDate);

      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const to12Hour = (time) => {
      if (!time || typeof time !== "string" || !time.includes(":")) return time || "TBD";
      let [h, m] = time.split(":");
      h = Number(h);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    };

    // ── 2. Build HTML & screenshot ────────────────────────────────────────────
    const logoUrl = logoBase64;
    const qr = await QRCode.toDataURL(u_id);
    const date = finalTicket?.eventDetails?.date
      ? new Date(finalTicket.eventDetails.date)
      : new Date();
    const formatted = date.toLocaleDateString("en-IN");

    const html = generateTicketHTML({
      name: username,
      logo: logoUrl,
      eventName: finalTicket?.eventDetails?.eventName || "Bharat Bhakti Sangam",
      poster: finalTicket?.venueDetails?.image || "",
      time: finalTicket?.eventDetails?.startTime
        ? `${to12Hour(finalTicket?.eventDetails?.startTime)} To ${to12Hour(finalTicket?.eventDetails?.endTime)}`
        : "Event Time",
      qr,
      u_id,
      visitors: allowVisitors,
      artistImage: finalTicket?.artistDetails?.[0]?.profileImage || "",
      artistName: finalTicket?.artistDetails?.[0]?.artistName || "",
      artistDesc: finalTicket?.artistDetails?.[0]?.about || "",
      location: finalTicket?.venueDetails?.venue || "",
      date: formatDate(date),
      venue: finalTicket?.venueDetails?.address || "Venue Details",
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

    const element = await page.$(".container");
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
        time: `${to12Hour(finalTicket?.eventDetails?.startTime)} To ${to12Hour(finalTicket?.eventDetails?.endTime)}`,
      },
      username,
    );

    // ── 5. Send WhatsApp ──────────────────────────────────────────────────────
    // ✅ FIX 1: fall back to bookingPhone (projected via $addFields above)
    const whatsappRecipient = formatWhatsAppNumber(
      phone ?? finalTicket?.bookingPhone,
    );

    // console.log("📱 WhatsApp recipient:", whatsappRecipient);
    // console.log("🖼️  Media URL:", uploadImage.secure_url);

    if (!whatsappRecipient) {
      console.warn(`⚠️ WhatsApp skipped: no phone found for ticket ${u_id}`);
    } else {
      const placeholders = [
        username,
        finalTicket?.eventDetails?.eventName,
        finalTicket?.venueDetails?.address,
        formatDate(date),
        `${to12Hour(finalTicket?.eventDetails?.startTime)} To ${to12Hour(finalTicket?.eventDetails?.endTime)}`,
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
  console.error("❌ Job failed:", job.id, err),
);
worker.on("error", (err) => console.error("❌ Worker error:", err));
