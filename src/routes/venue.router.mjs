import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  addVenueController,
  deleteVenueController,
  getAllVanueList,
  getAllVolunteerController,
  getSingleVenueDetailsController,
  statusUpdateVenueController,
  updateVenueController,
} from "../controllers/admin.controller.mjs";
import { getAllEvents } from "../controllers/event.controller.mjs";
const venueRouter = express.Router();
venueRouter.post(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  addVenueController,
);
venueRouter.get(
  "/all-venue",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllVanueList,
);
venueRouter.put(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateVenueController,
);

venueRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSingleVenueDetailsController,
);
venueRouter.get(
  "/all",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllVolunteerController,
);
venueRouter.delete(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  statusUpdateVenueController,
);

export default venueRouter;
