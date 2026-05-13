import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  addCalendarEntry,
  getAllCalendarEntry,
  getSingleFestivalEntry,
  updateCalenderEntry,
} from "../controllers/calendar.controller.mjs";
const calendarRouter = express.Router();
calendarRouter.post(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  addCalendarEntry,
);
calendarRouter.get(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllCalendarEntry,
);
calendarRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSingleFestivalEntry,
);
calendarRouter.put(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateCalenderEntry,
);

export default calendarRouter;
