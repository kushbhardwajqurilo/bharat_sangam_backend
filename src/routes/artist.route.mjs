import express from "express";
import {
  addArtistController,
  deleteArtistController,
  getAllArtistList,
  getArtistDetails,
  updateArtistController,
} from "../controllers/artistController.mjs";
import {
  accessMiddleware,
  AuthMiddleware,
} from "../middlewares/authMiddleware.mjs";
const artistRouter = express.Router();
artistRouter.post(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  addArtistController,
);
artistRouter.put(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  updateArtistController,
);
artistRouter.delete(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  deleteArtistController,
);
artistRouter.get(
  "/:id",
  AuthMiddleware,
  accessMiddleware("admin"),
  getArtistDetails,
);
artistRouter.get(
  "/",
  AuthMiddleware,
  accessMiddleware("admin"),
  getAllArtistList,
);
export default artistRouter;
