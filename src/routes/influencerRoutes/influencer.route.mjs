import express from "express";
import { getAllInfluencerRequest, getSingleIncluencer, requestInfluencer } from "../../controllers/influencerController/influencerController.mjs";
import { AuthMiddleware } from "../../middlewares/authMiddleware.mjs";
import { validateInfluencerRequest } from "../../middlewares/validationMiddleware.mjs";
import { influencerSchema } from "../../validations/influencer.validation.mjs";

const influencerRouter = express.Router();
influencerRouter.post("/", validateInfluencerRequest(influencerSchema), requestInfluencer);
influencerRouter.get("/", getAllInfluencerRequest);
influencerRouter.get("/:id", getSingleIncluencer);

export default influencerRouter;