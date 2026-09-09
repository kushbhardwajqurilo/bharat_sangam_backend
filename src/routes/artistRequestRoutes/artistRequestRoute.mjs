import express from "express";
import {
  addArtistController,
  getAllArtistList,
  getArtistDetails,
  updateArtistStatusController,
} from "../../controllers/artistController.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../../middlewares/authMiddleware.mjs";
import {
  validateParams,
  validateQuery,
  validateRequest,
} from "../../middlewares/validationMiddleware.mjs";
import {
  artistCreateSchema,
  artistParamsSchema,
  artistQuerySchema,
} from "../../validations/artist.validation.mjs";
import { requestSubmissionLimiter } from "../../middlewares/rateLimitMiddleware.mjs";

const artistRequestRouter = express.Router();

// Forward legacy /artistrequest endpoints to the unified Artist controller
artistRequestRouter.post(
  "/",
  requestSubmissionLimiter,
  validateRequest(artistCreateSchema),
  addArtistController,
);

artistRequestRouter.get(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateQuery(artistQuerySchema),
  getAllArtistList,
);

artistRequestRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(artistParamsSchema),
  getArtistDetails,
);

artistRequestRouter.patch(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateArtistStatusController,
);

export default artistRequestRouter;
