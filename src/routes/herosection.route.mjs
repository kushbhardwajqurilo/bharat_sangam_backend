import express from "express";
import { validateRequest } from "../middlewares/validationMiddleware.mjs";
import { heroSectionSchema } from "../validations/highlightAndTestimonial.validation.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  addAndUpdateHeroSectionController,
  getHeroSectionController,
} from "../controllers/heroSecionVideoConroller.mjs";
const heroSectionRouter = express.Router();

heroSectionRouter.post(
  "/hero-video",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateRequest(heroSectionSchema),
  addAndUpdateHeroSectionController,
);

heroSectionRouter.get("/hero-video", getHeroSectionController);
export default heroSectionRouter;
