import express from "express"
import { validateRequest, validateQuery } from "../../middlewares/validationMiddleware.mjs";
import { artistRequestSchema } from "../../validations/artist.validation.mjs";
import { artistRequest, getAllArtistRequest } from "../../controllers/artistRequesController/artistRequestController.mjs";
import { getAllRequestQuerySchema } from "../../validations/influencer.validation.mjs";
import { AuthMiddleware, accessMiddleware } from "../../middlewares/authMiddleware.mjs";
import { requestSubmissionLimiter } from "../../middlewares/rateLimitMiddleware.mjs";
const artistRequestRouter = express.Router();
artistRequestRouter.post('/', requestSubmissionLimiter, validateRequest(artistRequestSchema), artistRequest);
artistRequestRouter.get('/', AuthMiddleware, accessMiddleware("admin"), validateQuery(getAllRequestQuerySchema), getAllArtistRequest);

export default artistRequestRouter;