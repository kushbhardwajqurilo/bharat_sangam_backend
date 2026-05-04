import express from "express";
import {
  addBookingType,
  addCategoryController,
  addVenueController,
  addVolunteer,
  adminLogin,
  adminRegister,
  deleteBookingType,
  disableVolunteer,
  getAllBookingTypes,
  getAllCategoryController,
  getAllVanueList,
  getAllVolunteerController,
  getSingleBookingType,
  getSingleCategoryController,
  getSingleVolunteer,
  loginVolunteer,
  statusUpdateCategoryController,
  updateBookingType,
  updateCategoryController,
  updateVolunteer,
} from "../controllers/admin.controller.mjs";
import { logoutAdmin } from "../controllers/admin.controller.mjs";

import {
  deleteFromClodinary,
  getSignature,
} from "../controllers/cloudinary.controller.mjs";
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
adminRouter.delete(
  "/delete-upload",
  AuthMiddleware,
  accessMiddleware("admin"),
  deleteFromClodinary,
);
// volunteers requestt
adminRouter.post(
  "/volunteer",
  AuthMiddleware,
  accessMiddleware("admin"),
  addVolunteer,
);
adminRouter.get(
  "/volunteer",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllVolunteerController,
);
adminRouter.get(
  "/volunteer/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSingleVolunteer,
);
adminRouter.delete(
  "/volunteer/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  disableVolunteer,
);
adminRouter.put(
  "/volunteer/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateVolunteer,
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
  accessMiddleware("admin"),
  addCategoryController,
);
adminRouter.get(
  "/category",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllCategoryController,
);
adminRouter.get(
  "/category/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  getSingleCategoryController,
);
adminRouter.put(
  "/category/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateCategoryController,
);
adminRouter.delete(
  "/category/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  statusUpdateCategoryController,
);

// venue router
// adminRouter.post(
//   "/add-venue",
//   AuthMiddleware,
//   accessMiddleware("admin"),
//   addVenueController,
// );
// adminRouter.get(
//   "/all",
//   AuthMiddleware,
//   accessMiddleware("admin"),
//   getAllVanueList,
// );
// adminRouter.post(
//   "/add-venue",
//   AuthMiddleware,
//   accessMiddleware("admin"),
//   addVenueController,
// );
export default adminRouter;
