import express from "express";
import {
  createEvent,
  getAllEvents,
  getLatestEvent,
  getSingleEvent,
  latestEventCapacity,
  updateEvent,
} from "../controllers/event.controller.mjs";
const eventRouter = express.Router();
eventRouter.post("/", createEvent);
eventRouter.get("/latest", getLatestEvent);
eventRouter.get("/latest-capacity", latestEventCapacity);
eventRouter.get("/all-event", getAllEvents);
eventRouter.get("/:id", getSingleEvent);
eventRouter.put("/:id", updateEvent);
export default eventRouter;
