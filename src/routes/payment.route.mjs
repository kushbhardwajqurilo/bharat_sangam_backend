import express from "express";
import {
  getAllPaymentDetails,
  getSinglePaymentDetails,
} from "../controllers/paymnet.controller.mjs";
import { handleRazorpayWebhook } from "../controllers/paymentWebhook.controller.mjs";
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

/**
 * Public Webhook Endpoint (No JWT auth, signature verified in handler)
 */
paymentRouter.post("/webhook", handleRazorpayWebhook);

/**
 * Admin Protected Payment Lookups
 */
paymentRouter.get(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateQuery(getPaymentsQuerySchema),
  getAllPaymentDetails,
);

paymentRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(getPaymentByIdSchema),
  getSinglePaymentDetails,
);

export default paymentRouter;
