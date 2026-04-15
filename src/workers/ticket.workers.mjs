import dotenv from "dotenv";
import mongoose, { mongo } from "mongoose";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import { generateTicketHTML } from "../utils/ticketTemplate.mjs";
import { redisConnection } from "../config/redis.mjs";
import bookingModel from "../models/bookingModel.js";
import { sendTicketEmail } from "../config/mail.config.mjs";
import { Worker } from "bullmq";
import connectDB from "../config/databse.mjs";
dotenv.config();

console.log("🚀 Worker file loaded...");
await mongoose.connect(process.env.DB_URI, {
  serverSelectionTimeoutMS: 30000,
});
console.log("worker db connected");
let browser;

const worker = new Worker(
  "ticketQueue",
  async (job) => {
    console.log(" JOB RECEIVED:");
    const { ticketId, email, u_id, allowVisitors } = job.data;
    console.log(" Worker started...");
    const genTicket = await bookingModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(ticketId) } },

      // 🔹 Event Details (only selected fields)
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
                time: 1,
                venueName: 1,
                artists: 1,
              },
            },
          ],
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },

      // 🔹 Artist Details (only specific fields)
      {
        $lookup: {
          from: "artists",
          let: { artistIds: "$eventDetails.artists" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$artistIds"] } } },
            {
              $project: {
                artistName: 1,
                profileImage: 1,
                about: 1,
              },
            },
          ],
          as: "artistDetails",
        },
      },

      // 🔹 Venue Details (only specific fields)
      {
        $lookup: {
          from: "venues",
          let: { venueId: "$eventDetails.venueName" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$venueId"] } } },
            {
              $project: {
                venue: 1,
                address: 1,
                image: 1,
              },
            },
          ],
          as: "venueDetails",
        },
      },
      {
        $unwind: {
          path: "$venueDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const finalTicket = genTicket[0];
    // console.log("final", finalTicket);
    const qr = await QRCode.toDataURL(u_id);
    const date = new Date(finalTicket?.eventDetails?.date);

    const formatted = date.toLocaleDateString("en-IN");
    const html = generateTicketHTML({
      logo: "https://4frnn03l-8000.inc1.devtunnels.ms/logo.png",
      eventName: finalTicket?.eventDetails?.eventName,
      poster: `${finalTicket?.venueDetails?.image}`,
      time: finalTicket?.eventDetails?.time,
      qr,
      u_id,
      visitors: allowVisitors,
      artistImage: finalTicket?.artistDetails[0].profileImage,
      artistName: finalTicket?.artistDetails[0].artistName,
      artistDesc: finalTicket?.artistDetails[0].about,
      location: finalTicket?.venueDetails?.venue,
      date: formatted,
      venue: finalTicket?.venueDetails?.address,
    });

    //  Reuse browser
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
      });
    }

    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1800,
      deviceScaleFactor: 3, // 🔥 key for HD
    });

    await page.setContent(html, { waitUntil: "networkidle0" });

    const element = await page.$(".ticket");
    const boundingBox = await element.boundingBox();

    const buffer = await page.screenshot({
      type: "png",
      clip: boundingBox,
    });

    await page.close();

    const emailVal = await sendTicketEmail(email, buffer, u_id);
    console.log("emailVal", emailVal);
  },
  { connection: redisConnection },
);

console.log("👂 Worker listening...");

// 🔥 EVENTS (YAHAN LIKHNA HAI — WORKER KE BAAD)
worker.on("ready", () => {
  console.log("✅ Worker is ready and listening...");
});

worker.on("active", (job) => {
  console.log("⚡ Job active:", job.id);
});

worker.on("completed", (job) => {
  console.log("✅ Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("❌ Job failed:", err);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});
