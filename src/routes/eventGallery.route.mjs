import express from "express";
import {
  deleteEventGalleryController,
  eventGalleryController,
  getAllEventGalleryController,
  getSingleEventGallery,
  updateEventGalleryControler,
} from "../controllers/admin.controller.mjs";
import {
  validateParams,
  validateRequest,
} from "../middlewares/validationMiddleware.mjs";
import {
  eventGalleyScheam,
  updateEventGallerySchema,
} from "../validations/highlightAndTestimonial.validation.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import { getPaymentByIdSchema } from "../validations/payment.validation.mjs";

const eventGallery = express.Router();

eventGallery.post(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateRequest(eventGalleyScheam),
  eventGalleryController,
);

eventGallery.get("/", getAllEventGalleryController);
eventGallery.get(
  "/:id",
  validateParams(getPaymentByIdSchema),
  getSingleEventGallery,
);
eventGallery.put(
  "/:id",
  validateRequest(updateEventGallerySchema),
  updateEventGalleryControler,
);
eventGallery.delete(
  "/:id",
  validateParams(getPaymentByIdSchema),
  deleteEventGalleryController,
);

export default eventGallery;
