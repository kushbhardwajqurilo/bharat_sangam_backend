import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../../middlewares/authMiddleware.mjs";
import { getTestimonialUploadSignature } from "../../utils/videoUploader.mjs";
import {
  addTestimonialRequest,
  deleteSingleTestimonial,
  getAllTestimonials,
  updateTestimonial,
} from "../../controllers/testimonialController/testimonial.controller.mjs";
import {
  validateParams,
  validateRequest,
} from "../../middlewares/validationMiddleware.mjs";
import {
  highlightsSchema,
  updateHighlightsSchema,
} from "../../validations/highlightAndTestimonial.validation.mjs";
import { ParamsSchema } from "../../validations/influencer.validation.mjs";
const testimonialRouter = express.Router();
testimonialRouter.get(
  "/upload-signature",
  AuthMiddleware,
  accessMiddleware("admin"),
  getTestimonialUploadSignature,
);
testimonialRouter.post(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateRequest(highlightsSchema),
  addTestimonialRequest,
);
testimonialRouter.delete(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(ParamsSchema),
  deleteSingleTestimonial,
);
testimonialRouter.put(
  "/:id",
  //   AuthMiddleware,
  //   accessMiddleware("admin"),
  validateParams(ParamsSchema),
  validateRequest(updateHighlightsSchema),
  updateTestimonial,
);
testimonialRouter.get("/", getAllTestimonials);
export default testimonialRouter;
