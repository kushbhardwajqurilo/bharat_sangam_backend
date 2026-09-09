import express from "express";
import {
  addArtistController,
  deleteArtistController,
  getAllArtistList,
  getArtistDetails,
  updateArtistController,
  updateArtistStatusController,
} from "../controllers/artistController.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
import {
  validateParams,
  validateQuery,
  validateRequest,
} from "../middlewares/validationMiddleware.mjs";
import {
  artistCreateSchema,
  artistParamsSchema,
  artistQuerySchema,
  artistStatusUpdateSchema,
  artistUpdateSchema,
} from "../validations/artist.validation.mjs";
import { requestSubmissionLimiter } from "../middlewares/rateLimitMiddleware.mjs";

const artistRouter = express.Router();

// 1. POST /artist (Public Marketing Join or Admin Creation)
artistRouter.post(
  "/",
  requestSubmissionLimiter,
  validateRequest(artistCreateSchema),
  addArtistController,
);

// 2. GET /artist (Admin Listing with filters & pagination)
artistRouter.get(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateQuery(artistQuerySchema),
  getAllArtistList,
);

// 3. GET /artist/:id (Single Artist Fetch)
artistRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(artistParamsSchema),
  getArtistDetails,
);

// 4. PATCH /artist/:id/status & PATCH /artist/status (Approve / Reject Status Update)
artistRouter.patch(
  "/:id/status",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(artistParamsSchema),
  validateRequest(artistStatusUpdateSchema),
  updateArtistStatusController,
);

// Optional fallback for PATCH /artist with status query or body
artistRouter.patch(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateArtistStatusController,
);

// 5. PUT /artist/:id (Update Artist Details)
artistRouter.put(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(artistParamsSchema),
  validateRequest(artistUpdateSchema),
  updateArtistController,
);

// 6. DELETE /artist/:id (Delete Artist Record)
artistRouter.delete(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  validateParams(artistParamsSchema),
  deleteArtistController,
);

export default artistRouter;
