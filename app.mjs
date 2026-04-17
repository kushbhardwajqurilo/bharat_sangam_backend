import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandle } from "./src/utils/handler.mjs";

import adminRouter from "./src/routes/admin.route.mjs";
import BookingRouter from "./src/routes/booking.route.mjs";
import artistRouter from "./src/routes/artist.route.mjs";
import venueRouter from "./src/routes/venue.router.mjs";
import eventRouter from "./src/routes/event.route.mjs";
import feedbackRouter from "./src/routes/feedback.route.mjs";
import contactRouter from "./src/routes/contact.route.mjs";

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 DEBUG (keep for now)
app.use((req, res, next) => {
  console.log("🔥 HIT:", req.method, req.url);
  next();
});

// ================= CORS =================
const allowOrigins = [
  "http://localhost:3000",
  "https://l3zz8htl-3000.inc1.devtunnels.ms",
  "http://209.74.88.2:3011",
];

const corsOrigins = {
  origin: function (origin, callback) {
    if (!origin || allowOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOrigins));

// ================= HEALTH =================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ================= PATH FIX =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// ================= ROUTES =================

// 🔥 FIXED BASE (NO TRAILING SLASH)
const base = "/api/v1";

// test route
app.get("/test", (req, res) => {
  res.json({ success: true, message: "API working ✅" });
});

// ticket preview
app.get("/ticket", (req, res) => {
  const filePath = path.join(__dirname, "src/templates", "ticketTemplate.html");
  res.sendFile(filePath);
});

// main routes
app.use(`${base}/admin`, adminRouter);
app.use(`${base}/booking`, BookingRouter);
app.use(`${base}/artist`, artistRouter);
app.use(`${base}/venue`, venueRouter);
app.use(`${base}/event`, eventRouter);
app.use(`${base}/feedback`, feedbackRouter);
app.use(`${base}/contact`, contactRouter);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found ❌",
    url: req.originalUrl,
  });
});

// ================= ERROR HANDLER =================
app.use(errorHandle);

export default app;
