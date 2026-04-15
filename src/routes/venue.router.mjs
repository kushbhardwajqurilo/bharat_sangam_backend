import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  addVenueController,
  deleteVenueController,
  getAllVolunteerController,
  getSingleVenueDetailsController,
  updateVenueController,
} from "../controllers/admin.controller.mjs";
const venueRouter = express.Router();
venueRouter.post(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  addVenueController,
);
venueRouter.put(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateVenueController,
);
venueRouter.delete(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  deleteVenueController,
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

export default venueRouter;
