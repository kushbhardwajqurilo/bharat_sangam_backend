import adminModel from "../models/adminModel.js";
import tokenModel from "../models/tokenModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import { compareHashPassword, hashPassword } from "../utils/hashPash.mjs";
import jwt from "jsonwebtoken";

// ================= TOKEN FUNCTIONS =================

// ✅ Access Token
const generateAccessToken = (data) => {
  return jwt.sign(
    {
      id: data.admin_id,
      role: data.role,
    },
    process.env.ACCESS_SECRET,
    { expiresIn: "30m" },
  );
};

// ✅ Refresh Token (DB stored)
const generateRefreshToken = async (user, expire = "7d") => {
  const refresh_token = jwt.sign(
    {
      id: user.admin_id,
      role: user.role,
    },
    process.env.REFRESH_SECRET,
    { expiresIn: expire },
  );

  // 🔥 UPSERT → one user = one token
  await tokenModel.findOneAndUpdate(
    { adminId: user.admin_id },
    {
      token: refresh_token,
      createdAt: new Date(), //  reset TTL
    },
    {
      upsert: true,
      new: true,
    },
  );

  return refresh_token;
};

// ================= REGISTER =================

export const adminRegister = catchAsync(async (req, res, next) => {
  const rquriedFields = ["email", "phone", "password", "name"];

  const missingFields = rquriedFields.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingFields) {
    return next(new AppError(`${missingFields} is missing`, 400));
  }

  const { name, email, password, phone } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid Email Format", 400));
  }

  if (password.trim().length < 8) {
    return next(
      new AppError("Password must be at least 8 characters long", 400),
    );
  }

  const hashPass = await hashPassword(password);

  const admin = await adminModel.create({
    name,
    email,
    password: hashPass,
    phone: Number(phone),
    role: "admin",
  });

  if (!admin) {
    return next(new AppError("Failed to register admin", 400));
  }

  return sendSuccess(res, "Admin registered successfully", {}, 200);
});

// ================= LOGIN =================

export const adminLogin = catchAsync(async (req, res, next) => {
  const rquriedFields = ["email", "password"];

  const missingFields = rquriedFields.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingFields) {
    return next(new AppError(`${missingFields} is missing`, 400));
  }

  const { email, password } = req.body;

  const admin = await adminModel
    .findOne({ email })
    .select("_id email password role");

  if (!admin) {
    return next(new AppError("Email not exist", 400));
  }

  const isMatch = await compareHashPassword(password, admin.password);

  if (!isMatch) {
    return next(new AppError("Invalid Password", 400));
  }

  //  Tokens
  const access_token = generateAccessToken({
    admin_id: admin._id,
    role: "admin",
  });

  const refresh_token = await generateRefreshToken(
    {
      admin_id: admin._id,
      role: "admin",
    },
    "7d",
  );
  return sendSuccess(
    res,
    "Login successful",
    {
      access_token,
      refresh_token,
    },
    200,
  );
});

// ================= REFRESH TOKEN =================

export const refreshAccessToken = catchAsync(async (req, res, next) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return next(new AppError("Refresh token required", 400));
  }

  let decoded;

  try {
    decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET);
  } catch (err) {
    return next(new AppError("Invalid or expired refresh token", 401));
  }

  const storedToken = await tokenModel.findOne({
    userId: decoded.id,
    token: refresh_token,
  });

  if (!storedToken) {
    return next(new AppError("Refresh token not found", 401));
  }

  const newAccessToken = generateAccessToken({
    admin_id: decoded.id,
    role: decoded.role,
  });

  return sendSuccess(
    res,
    "New access token generated",
    {
      access_token: newAccessToken,
    },
    200,
  );
});

// ================= LOGOUT =================

export const logoutAdmin = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  await tokenModel.findOneAndDelete({ userId });

  return sendSuccess(res, "Logged out successfully", {}, 200);
});
