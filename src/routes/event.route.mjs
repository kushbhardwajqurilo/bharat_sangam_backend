import express from "express";
import {
  createEvent,
  getLatestEvent,
  getSingleEvent,
  latestEventCapacity,
} from "../controllers/event.controller.mjs";
const eventRouter = express.Router();

eventRouter.post("/", createEvent);
eventRouter.get("/latest", getLatestEvent);
eventRouter.get("/latest-capacity", latestEventCapacity);

export default eventRouter;
