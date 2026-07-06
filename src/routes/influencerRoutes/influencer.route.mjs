import express from "express";
import { approveRejectInfluencer, deleteInfluencer, getAllInfluencerRequest, getSingleIncluencer, MultipleInfluencerDelete, requestInfluencer } from "../../controllers/influencerController/influencerController.mjs";
import { accessMiddleware, AuthMiddleware } from "../../middlewares/authMiddleware.mjs";
import { validateRequest, validateParams, validateQuery } from "../../middlewares/validationMiddleware.mjs";
import { getAllRequestQuerySchema, influencerParamsSchema, influencerSchema, influencerStatusSchema, multipleInfluencerDeleteSchema } from "../../validations/influencer.validation.mjs";
import { requestSubmissionLimiter } from "../../middlewares/rateLimitMiddleware.mjs";

const influencerRouter = express.Router();
influencerRouter.post("/", requestSubmissionLimiter, validateRequest(influencerSchema), requestInfluencer);
influencerRouter.get("/", AuthMiddleware, accessMiddleware("admin"), validateQuery(getAllRequestQuerySchema), getAllInfluencerRequest);
influencerRouter.get("/:id", AuthMiddleware, accessMiddleware("admin"), validateParams(influencerParamsSchema), getSingleIncluencer);
influencerRouter.delete("/:id", AuthMiddleware, accessMiddleware("admin"), validateParams(influencerParamsSchema), deleteInfluencer);
influencerRouter.delete("/multiple", AuthMiddleware, accessMiddleware("admin"), validateRequest(multipleInfluencerDeleteSchema), MultipleInfluencerDelete)

influencerRouter.patch('/', AuthMiddleware, accessMiddleware("admin"), validateQuery(influencerStatusSchema), approveRejectInfluencer)
export default influencerRouter; 