import { AppError } from "./handler.mjs";
import jwt from "jsonwebtoken";
async function verifyAdmin(payload) {
  if (payload) {
    if (!payload.startsWith("Bearer")) {
      throw new AppError("Invalid authorization format", 401);
    }
    const token = payload.split(" ")[1];
    if (!token) throw new AppError("Access Token Required", 401);
    try {
      const decode = jwt.verify(token, process.env.ACCESS_SECRET);
      if (decode.role === "admin") return true;
      else return false;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Token Expired Please Login Again.", 401);
      }
      throw new AppError("Invalid or malformed token", 402);
    }
  } else {
    return false;
  }
}

export default verifyAdmin;
