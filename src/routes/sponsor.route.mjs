import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  createSponsor,
  deleteSponsor,
  getSponsors,
  updateSponsor,
} from "../controllers/sponsor.controller.mjs";
import { validateRequest } from "../middlewares/validationMiddleware.mjs";
import { sponsorSchema } from "../validations/sponsorship.validation.mjs";
const sponsorRouter = express.Router();
sponsorRouter.post("/enquiry", validateRequest(sponsorSchema), createSponsor);
sponsorRouter.get(
  "/all-enquiries",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSponsors,
);
sponsorRouter.patch(
  "/enquiry/:id/status",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateSponsor,
);
sponsorRouter.delete(
  "/enquiry/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  deleteSponsor,
);

export default sponsorRouter;
