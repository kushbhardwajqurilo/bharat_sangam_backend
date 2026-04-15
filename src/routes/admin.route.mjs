import express from "express";
import {
  addBookingType,
  addCategoryController,
  addVenueController,
  addVolunteer,
  adminLogin,
  adminRegister,
  deleteBookingType,
  getAllBookingTypes,
  getAllCategoryController,
  getSingleBookingType,
  getSingleCategoryController,
  loginVolunteer,
  updateBookingType,
  updateCategoryController,
} from "../controllers/admin.controller.mjs";
import { logoutAdmin } from "../controllers/admin.controller.mjs";

import { getSignature } from "../controllers/cloudinary.controller.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";

const adminRouter = express.Router();
adminRouter.post("/register", adminRegister);
adminRouter.post("/login", adminLogin);
// presign url request route
adminRouter.get(
  "/presign-url",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSignature,
);

// volunteers requestt
adminRouter.post(
  "/add-volunteer",
  AuthMiddleware,
  accessMiddleware("admin"),
  addVolunteer,
);
adminRouter.post("/login-volunteer", loginVolunteer);

// booking type router
adminRouter.post(
  "/booking-type",
  AuthMiddleware,
  accessMiddleware("admin"),
  addBookingType,
);
adminRouter.put(
  "/booking-type/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateBookingType,
);
adminRouter.delete(
  "/booking-type",
  AuthMiddleware,
  accessMiddleware("admin"),
  deleteBookingType,
);
adminRouter.get(
  "/getall-bookingtype",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllBookingTypes,
);
adminRouter.get(
  "/get-single-bookingtype",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSingleBookingType,
);
// category routes
adminRouter.post(
  "/add-category",
  AuthMiddleware,
  accessMiddleware,
  addCategoryController,
);
adminRouter.get(
  "/getAll-category",
  AuthMiddleware,
  accessMiddleware,
  getAllCategoryController,
);
adminRouter.get(
  "/getSingle-category/:id",
  AuthMiddleware,
  accessMiddleware,
  getSingleCategoryController,
);
adminRouter.put(
  "/add-category/:id",
  AuthMiddleware,
  accessMiddleware,
  updateCategoryController,
);

// venue router
adminRouter.post(
  "/add-venue",
  AuthMiddleware,
  accessMiddleware("admin"),
  addVenueController,
);
export default adminRouter;
