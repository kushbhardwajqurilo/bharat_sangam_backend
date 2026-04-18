import express from "express";
import { addSubscribers } from "../controllers/subscriber.controller.mjs";
const subscriberRouter = express.Router();

subscriberRouter.post("/", addSubscribers);
export default subscriberRouter;
