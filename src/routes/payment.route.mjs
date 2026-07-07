import express from "express";
import {
  getAllPaymentDetails,
  getSinglePaymentDetails,
} from "../controllers/paymnet.controller.mjs";
import {
  AuthMiddleware,
  accessMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  validateParams,
  validateQuery,
} from "../middlewares/validationMiddleware.mjs";
import {
  getPaymentByIdSchema,
  getPaymentsQuerySchema,
} from "../validations/payment.validation.mjs";

const paymentRouter = express.Router();

paymentRouter.use(AuthMiddleware, accessMiddleware("admin"));

paymentRouter.get(
  "/",
  validateQuery(getPaymentsQuerySchema),
  getAllPaymentDetails
);

paymentRouter.get(
  "/:id",
  validateParams(getPaymentByIdSchema),
  getSinglePaymentDetails
);

export default paymentRouter;
