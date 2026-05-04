import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  createSponsor,
  getSponsors,
} from "../controllers/sponsor.controller.mjs";
const sponsorRouter = express.Router();
sponsorRouter.post(
  "/add-sponsors",
  AuthMiddleware,
  accessMiddleware("admin"),
  createSponsor,
);
sponsorRouter.get(
  "/get-all",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSponsors,
);

export default sponsorRouter;
