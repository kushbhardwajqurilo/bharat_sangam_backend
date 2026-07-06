import express from "express"
import { validateRequest, validateQuery, validateParams } from "../../middlewares/validationMiddleware.mjs";
import { artistRequestSchema } from "../../validations/artist.validation.mjs";
import { approveRejectArtistRequest, artistRequest, getAllArtistRequest, getSingleArtistRequest } from "../../controllers/artistRequesController/artistRequestController.mjs";
import { getAllRequestQuerySchema } from "../../validations/influencer.validation.mjs";
import { AuthMiddleware, accessMiddleware } from "../../middlewares/authMiddleware.mjs";
import { requestSubmissionLimiter } from "../../middlewares/rateLimitMiddleware.mjs";
import { ParamsSchema, StatusSchema } from "../../validations/influencer.validation.mjs";
const artistRequestRouter = express.Router();
artistRequestRouter.post('/', requestSubmissionLimiter, validateRequest(artistRequestSchema), artistRequest);
artistRequestRouter.get('/', AuthMiddleware, accessMiddleware("admin"), validateQuery(getAllRequestQuerySchema), getAllArtistRequest);
artistRequestRouter.get('/:id', AuthMiddleware, accessMiddleware("admin"), validateParams(ParamsSchema), getSingleArtistRequest);
artistRequestRouter.patch('/:id', AuthMiddleware, accessMiddleware("admin"), validateParams(ParamsSchema), validateQuery(StatusSchema), approveRejectArtistRequest);
export default artistRequestRouter;