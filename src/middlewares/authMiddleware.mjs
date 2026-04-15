import jwt from "jsonwebtoken";
import { AppError, catchAsync } from "../utils/handler.mjs";

export const AuthMiddleware = catchAsync(async (req, res, next) => {
  const authHeader = req["headers"]["authorization"];
  if (!authHeader) {
    return next(new AppError("Authorization Headers missing", 401));
  }
  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError("Invalid authorization format", 401));
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Access Token Missing", 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    if (decoded?.role === "admin") req.admin_id = decoded.id;
    if (decoded?.role === "volunteer") req.id = decoded.id;

    req.role = decoded.role;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token Expired. Please login again", 401));
    }
    return next(new AppError("Invalid or malformed token", 402));
  }
});

// accessRole middleware
export const accessMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(new AppError(`access only for admin`, 401));
    } else next();
  };
};

// volunteer middleware
export const volunteerAuthMiddleware = catchAsync(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return next(new AppError("Authorization missing", 400));
  }
  const volunteerToken = authHeader.split(" ")[1];
  if (!volunteerToken) {
    return next(new AppError("Token missing in the headers", 400));
  }

  let volunteerInfo;
  try {
    volunteerInfo = jwt.verify(volunteerToken, process.env.VOLUNTEER_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Token has expired. Login Again.", 400));
    }
    return next(new AppError("Authorizaion Failed", 400));
  }
  req.v_id = volunteerInfo.id;
  req.role = volunteerInfo.role;
  next();
});

// admin aur volunteer both access
const volunteerrOrAdminAuthMiddleware = async (req, res, next) => {
  // 🔹 try worker auth first
  volunteerAuthMiddleware(req, res, (err) => {
    if (!err) {
      // worker verified
      req.authType = "volunteer";
      return next();
    }

    // 🔹 worker failed → try admin auth
    AuthMiddleware(req, res, (adminErr) => {
      if (!adminErr) {
        // admin verified
        req.authType = "admin";
        return next();
      }

      // ❌ both failed
      return next(
        new AppError("Unauthorized: worker or admin token required", 401),
      );
    });
  });
};
