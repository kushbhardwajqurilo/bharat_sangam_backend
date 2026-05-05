import express from "express";
import {
  contactController,
  getAllQuery,
} from "../controllers/contact.controller.mjs";
import { getSingleBookingType } from "../controllers/admin.controller.mjs";
const contactRouter = express.Router();
contactRouter.post("/", contactController);
contactRouter.get("/", getAllQuery);
contactRouter.get("/:id", getSingleBookingType);
export default contactRouter;
