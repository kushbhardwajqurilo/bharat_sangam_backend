import express from "express";
import {
  addManualAttended,
  createEvent,
  getAllEvents,
  getLatestEvent,
  getSingleEvent,
  latestEventCapacity,
  updateEvent,
} from "../controllers/event.controller.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
const eventRouter = express.Router();
eventRouter.post("/", createEvent);
eventRouter.get("/latest", getLatestEvent);
eventRouter.get("/latest-capacity", latestEventCapacity);
eventRouter.get("/all-event", getAllEvents);
eventRouter.get("/:id", getSingleEvent);
eventRouter.put("/:id", updateEvent);
eventRouter.post(
  "/:id/manual-attendance",
  AuthMiddleware,
  accessMiddleware("admin"),
  addManualAttended,
);
export default eventRouter;
