import express from "express";
import { approveRejectInfluencer, deleteInfluencer, getAllInfluencerRequest, getSingleIncluencer, MultipleInfluencerDelete, requestInfluencer } from "../../controllers/influencerController/influencerController.mjs";
import { accessMiddleware, AuthMiddleware } from "../../middlewares/authMiddleware.mjs";
import { validateInfluencerRequest, validateParams, validateQuery } from "../../middlewares/validationMiddleware.mjs";
import { getAllInfluencerRequestQuerySchema, influencerParamsSchema, influencerSchema, influencerStatusSchema, multipleInfluencerDeleteSchema } from "../../validations/influencer.validation.mjs";

const influencerRouter = express.Router();
influencerRouter.post("/", validateInfluencerRequest(influencerSchema), requestInfluencer);
influencerRouter.get("/", AuthMiddleware, accessMiddleware("admin"), validateQuery(getAllInfluencerRequestQuerySchema), getAllInfluencerRequest);
influencerRouter.get("/:id", AuthMiddleware, accessMiddleware("admin"), validateParams(influencerParamsSchema), getSingleIncluencer);
influencerRouter.delete("/:id", AuthMiddleware, accessMiddleware("admin"), validateParams(influencerParamsSchema), deleteInfluencer);
influencerRouter.delete("/multiple", AuthMiddleware, accessMiddleware("admin"), validateInfluencerRequest(multipleInfluencerDeleteSchema), MultipleInfluencerDelete)

influencerRouter.post('/status', AuthMiddleware, accessMiddleware("admin"), validateQuery(influencerStatusSchema), approveRejectInfluencer)
export default influencerRouter; 