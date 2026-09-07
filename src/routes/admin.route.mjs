import express from "express";
import multer from "multer";
import {
  addBookingType,
  addCategoryController,
  addVolunteer,
  adminLogin,
  adminRegister,
  deleteBookingType,
  disableVolunteer,
  forgetPassword,
  getAllBookingTypes,
  getAllCategoryController,
  getAllVolunteerController,
  getSingleBookingType,
  getSingleCategoryController,
  getSingleVolunteer,
  loginVolunteer,
  mailSent,
  resetPassword,
  statusUpdateCategoryController,
  updateBookingType,
  updateCategoryController,
  updateVolunteer,
} from "../controllers/admin.controller.mjs";

import {
  deleteFromClodinary,
  getSignature,
} from "../controllers/cloudinary.controller.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  dahsboardCardAnalytics,
  dashboardBarChartAnalytics,
  dashboardLineChartAnalytics,
} from "../controllers/event.controller.mjs";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
});
const adminRouter = express.Router();
adminRouter.post("/register", adminRegister);
adminRouter.post("/login", adminLogin);
// presign url request route
adminRouter.get(
  "/presign-url",
  // AuthMiddleware,
  // accessMiddleware("admin"),
  getSignature,
);
adminRouter.delete(
  "/presign-url",
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
  "/booking-type/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  deleteBookingType,
);
adminRouter.get(
  "/booking-type",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllBookingTypes,
);
adminRouter.get(
  "/booking-type/:id",
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
adminRouter.post("/email", upload.array("attachments", 5), mailSent);

// <------- dashboard analytics route   ---------->

adminRouter.get(
  "/dashboard/analytics",
  AuthMiddleware,
  accessMiddleware("admin"),
  dahsboardCardAnalytics,
);

adminRouter.get(
  "/dashboard/booking-trend",
  // AuthMiddleware,
  // accessMiddleware("admin"),
  dashboardLineChartAnalytics,
);
adminRouter.get(
  "/dashboard/booking-registration-trend",
  AuthMiddleware,
  accessMiddleware("admin"),
  dashboardBarChartAnalytics,
);
// <------- dashboard analytics route end  ---------->

// < -------- forget password---------- >
adminRouter.post("/forgot-password", forgetPassword);
adminRouter.post("/reset-password", resetPassword);
// < -------- forget password end---------- >
export default adminRouter;
