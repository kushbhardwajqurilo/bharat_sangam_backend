import express from "express";
import { adminLogin, adminRegister } from "../controllers/admin.controller.mjs";
import { logoutAdmin } from "../controllers/admin.controller.mjs";
const adminRouter = express.Router();
adminRouter.post("/register", adminRegister);
adminRouter.post("/login", adminLogin);

export default adminRouter;
