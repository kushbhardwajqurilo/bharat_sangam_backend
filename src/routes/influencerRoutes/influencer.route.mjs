import express from "express";
import { deleteInfluencer, getAllInfluencerRequest, getSingleIncluencer, requestInfluencer } from "../../controllers/influencerController/influencerController.mjs";
import { accessMiddleware, AuthMiddleware } from "../../middlewares/authMiddleware.mjs";
import { validateInfluencerRequest, validateParams, validateQuery } from "../../middlewares/validationMiddleware.mjs";
import { getAllInfluencerRequestQuerySchema, influencerParamsSchema, influencerSchema } from "../../validations/influencer.validation.mjs";

const influencerRouter = express.Router();
influencerRouter.post("/", validateInfluencerRequest(influencerSchema), requestInfluencer);
influencerRouter.get("/", AuthMiddleware, accessMiddleware("admin"), validateQuery(getAllInfluencerRequestQuerySchema), getAllInfluencerRequest);
influencerRouter.get("/:id", AuthMiddleware, accessMiddleware("admin"), validateParams(influencerParamsSchema), getSingleIncluencer);
influencerRouter.delete("/:id", AuthMiddleware, accessMiddleware("admin"), validateParams(influencerParamsSchema), deleteInfluencer);

export default influencerRouter;