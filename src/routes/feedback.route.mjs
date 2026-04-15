import express from "express";
import { feedbackController } from "../controllers/feedback.contoller.mjs";
const feedbackRouter = express.Router();
feedbackRouter.post("/", feedbackController);
export default feedbackRouter;
