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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowOrigins = [
  "http://localhost:3000",
  "https://l3zz8htl-3000.inc1.devtunnels.ms",
];

const corsOrigins = {
  origin: function (origin, callback) {
    if (!origin || allowOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin:${origin}`);
      callback(new Error("Not allowed by  CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOrigins));
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
const base = "/api/v1/";
// fix __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// route
app.get("/ticket", (req, res) => {
  const filePath = path.join(__dirname, "src/templates", "ticketTemplate.html");
  res.sendFile(filePath);
});
app.use(`${base}admin`, adminRouter);
app.use(`${base}booking`, BookingRouter);
app.use(`${base}artist`, artistRouter);
app.use(`${base}venue`, venueRouter);
app.use(`${base}event`, eventRouter);
app.use(`${base}feedback`, feedbackRouter);
app.use(`${base}contact`, contactRouter);
app.use(errorHandle);
export default app;
