import express from "express";
import { getVideoUploadSignature } from "../../utils/videoUploader.mjs";
import { addHighlight, deleteSingleHighlight, getAllHighlights } from "../../controllers/highlightsController/highlight.controller.mjs";
import { highlightsSchema } from "../../validations/highlight.validation.mjs";
import { validateParams, validateRequest } from "../../middlewares/validationMiddleware.mjs";
import { ParamsSchema } from "../../validations/influencer.validation.mjs";
import { accessMiddleware, AuthMiddleware } from "../../middlewares/authMiddleware.mjs";

const highlightsRouter = express.Router();
highlightsRouter.get("/upload-signature", AuthMiddleware, accessMiddleware("admin"), getVideoUploadSignature);
highlightsRouter.post("/", AuthMiddleware, accessMiddleware("admin"), validateRequest(highlightsSchema), addHighlight);
highlightsRouter.delete('/:id', AuthMiddleware, accessMiddleware("admin"), validateParams(ParamsSchema), deleteSingleHighlight);
highlightsRouter.get("/", getAllHighlights);

export default highlightsRouter;