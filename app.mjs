import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { errorHandle } from "./src/utils/handler.mjs";

import adminRouter from "./src/routes/admin.route.mjs";
import BookingRouter from "./src/routes/booking.route.mjs";
import artistRouter from "./src/routes/artist.route.mjs";
import venueRouter from "./src/routes/venue.router.mjs";
import eventRouter from "./src/routes/event.route.mjs";
import feedbackRouter from "./src/routes/feedback.route.mjs";
import contactRouter from "./src/routes/contact.route.mjs";
import subscriberRouter from "./src/routes/subscriber.route.mjs";
import sponsorRouter from "./src/routes/sponsor.route.mjs";

const app = express();

/* ================= CORE SETTINGS ================= */

//  IMPORTANT (for VPS + Nginx)
app.set("trust proxy", 1);

// Disable Express fingerprint
app.disable("x-powered-by");

/* ================= MIDDLEWARE ================= */

// Body limit (DoS protection)
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Security headers
app.use(helmet());

// 🚫 Block common attack paths (.env etc)
app.use((req, res, next) => {
  if (req.url.includes(".env")) {
    console.warn("⚠️ Blocked attempt:", req.ip, req.url);
    return res.status(403).send("Forbidden");
  }
  next();
});

// Rate limiter (API only)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, try again later 🚫",
  },
});

app.use("/api", limiter);

/* ================= CORS ================= */

const allowOrigins = [
  process.env.NODE_ENV === "production"
    ? "https://bharatbhaktisangam.com"
    : "http://localhost:3000",
  process.env.NODE_ENV === "production"
    ? "https://bharatbhaktisangam.com"
    : "https://l3zz8htl-3000.inc1.devtunnels.ms",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

/* ================= DEBUG (optional) ================= */

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("🔥", req.method, req.url);
    next();
  });
}

/* ================= HEALTH ================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ================= PATH SETUP ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Docs
app.get("/api-docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "swagger.html"));
});

app.get("/api-docs/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "openapi.json"));
});

app.get("/api-docs/postman-collection.json", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "postman_collection.json"));
});

/* ================= ROUTES ================= */

const base = "/api/v1";

// Test
app.get("/test", (req, res) => {
  res.json({ success: true, message: "API working ✅" });
});

// Ticket preview
app.get("/ticket", (req, res) => {
  res.sendFile(path.join(__dirname, "src/templates", "ticketTemplate.html"));
});

// Main APIs
app.use(`${base}/admin`, adminRouter);
app.use(`${base}/booking`, BookingRouter);
app.use(`${base}/artist`, artistRouter);
app.use(`${base}/venue`, venueRouter);
app.use(`${base}/event`, eventRouter);
app.use(`${base}/feedback`, feedbackRouter);
app.use(`${base}/contact`, contactRouter);
app.use(`${base}/subscriber`, subscriberRouter);
app.use(`${base}/sponsor`, sponsorRouter);

/* ================= 404 ================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found ❌",
    url: req.originalUrl,
  });
});

/* ================= ERROR ================= */

app.use(errorHandle);

export default app;
