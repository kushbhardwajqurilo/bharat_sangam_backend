import express from "express";
import cors from "cors";
import { errorHandle } from "./src/utils/handler.mjs";
import adminRouter from "./src/routes/admin.route.mjs";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extented: true }));
const allowOrigins = ["http://localhost:300"];

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
app.use(`${base}admin`, adminRouter);
app.use(errorHandle);
export default app;
