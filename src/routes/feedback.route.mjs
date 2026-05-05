import express from "express";
import {
  feedbackController,
  getAllFeedbacks,
} from "../controllers/feedback.contoller.mjs";
const feedbackRouter = express.Router();
feedbackRouter.post("/", feedbackController);
feedbackRouter.get("/", getAllFeedbacks);
export default feedbackRouter;
