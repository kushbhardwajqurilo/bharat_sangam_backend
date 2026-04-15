import express from "express";
import {
  createEvent,
  getLatestEvent,
  getSingleEvent,
} from "../controllers/event.controller.mjs";
const eventRouter = express.Router();

eventRouter.post("/", createEvent);
eventRouter.get("/latest", getLatestEvent);

export default eventRouter;
