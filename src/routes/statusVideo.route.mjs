import express from "express";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  addStatusVideo,
  getSingleStatusVideoDetails,
  getStatusVideo,
  statusDownloadCount,
  statusVideoDelete,
  updateStatusVideoDetails,
} from "../controllers/admin.controller.mjs";
import {
  validateParams,
  validateQuery,
  validateRequest,
} from "../middlewares/validationMiddleware.mjs";
import {
  getAllStatusVideoSchema,
  statusVideoSchema,
  updateStatudVideoSchema,
} from "../validations/statusVideo.validation.mjs";
import { requestSubmissionLimiter } from "../middlewares/rateLimitMiddleware.mjs";
import { getPaymentByIdSchema } from "../validations/payment.validation.mjs";

const statusVideoRouter = express.Router();
statusVideoRouter.post(
  "/",
  requestSubmissionLimiter,
  AuthMiddleware,
  accessMiddleware("admin"),
  validateRequest(statusVideoSchema),
  addStatusVideo,
);

statusVideoRouter.get(
  "/",
  validateQuery(getAllStatusVideoSchema),
  getStatusVideo,
);

statusVideoRouter.get(
  "/:id",
  validateParams(getPaymentByIdSchema),
  getSingleStatusVideoDetails,
);
statusVideoRouter.put(
  "/:id",
  validateParams(getPaymentByIdSchema),
  validateRequest(updateStatudVideoSchema),
  updateStatusVideoDetails,
);
statusVideoRouter.delete(
  "/:id",
  validateParams(getPaymentByIdSchema),
  statusVideoDelete,
);
statusVideoRouter.post(
  "/:id/download",
  validateParams(getPaymentByIdSchema),
  statusDownloadCount,
);
export default statusVideoRouter;
