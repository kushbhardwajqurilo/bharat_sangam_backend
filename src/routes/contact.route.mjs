import express from "express";
import { contactController } from "../controllers/contact.controller.mjs";
const contactRouter = express.Router();
contactRouter.post("/", contactController);
export default contactRouter;
