import adminModel from "../models/adminModel.js";
import tokenModel from "../models/tokenModel.mjs";
import volunteerModel from "../models/volunteerModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import { compareHashPassword, hashPassword } from "../utils/hashPash.mjs";
import jwt from "jsonwebtoken";
import { generatePassword } from "../utils/randomPasswordGenerate.mjs";
import bookingTypemodel from "../models/bookingType.mjs";
import mongoose, { mongo } from "mongoose";
import venueModel from "../models/venueModel.js";
import categoryModel from "../models/categoryModel.js";

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

// <--------- Volunteer Start From Here  ---------->

export const addVolunteer = catchAsync(async (req, res, next) => {
  const { admin_id } = req;
  if (!admin_id) {
    return next(new AppError("Admin Authentication Failed", 401));
  }
  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return next(new AppError("Invalid Admin Signature", 401));
  }
  const requiredFields = ["name", "email"];

  const missingField = requiredFields.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingField) {
    return next(new AppError(`${missingField} is missing`, 400));
  }

  const { name, email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid email format", 400));
  }
  const existingEmail = await volunteerModel.findOne({ email }).select("_id");
  if (existingEmail) {
    return next(new AppError("Email already in use", 400));
  }
  const password = generatePassword();
  const hashedPassword = await hashPassword(password);
  const volunteer = await volunteerModel.create({
    name,
    email,
    password: hashedPassword,
  });
  if (!volunteer) {
    return next(new AppError("failed to add volunteer", 400));
  }

  return sendSuccess(
    res,
    "Volunteer added successfully",
    { password },
    201,
    true,
  );
});

// <---------- login Volunteer ------------>
export const loginVolunteer = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid email format", 400));
  }

  if (password.trim().length < 8) {
    return next(
      new AppError("Password must be at least 8 characters long", 400),
    );
  }
  const isValunteer = await volunteerModel.findOne({ email });
  if (!isValunteer) {
    return next(new AppError("Invalid Eamil", 400));
  }
  if (!isValunteer?.active) {
    return next(
      new AppError("Your account has been temporarily disabled", 403),
    );
  }
  const correctPassword = await compareHashPassword(
    password,
    isValunteer.password,
  );
  if (!correctPassword) {
    return next(new AppError("Invalid Password Try again later", 400));
  }
  const access_token = jwt.sign(
    { id: isValunteer?._id, role: "volunteer" },
    process.env.VOLUNTEER_SECRET,
    { expiresIn: "3d" },
  );
  return sendSuccess(res, "login successfull", access_token, 200, true);
});

//  Disable Volunteer
export const disableVolunteer = catchAsync(async (params) => {
  const { admin_id } = req;
  const { id } = req.params;
  if (!admin_id) {
    return next(new AppError("Admin Authentication Failed", 401));
  }
  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return next(new AppError("Invalid Admin Signature"));
  }
  if (!id) {
    return next(new AppError("vounteer id missing", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("invalid volunteer id"));
  }
  const isAdmin = await adminModel.findOne({ _id: admin_id });
  if (!isAdmin) {
    return next(new AppError("Invalid Admin", 400));
  }
  const result = await volunteerModel.findOne({ _id: id });
  if (!result) {
    return next(new AppError("volunteer not found", 400));
  }
  if (!result?.active) {
    return next(new AppError("Volunterr already disable", 400));
  }
  return sendSuccess(res, "success", {}, 201, true);
});

// get all volunteer
export const getAllVolunteerController = catchAsync(async (req, res, next) => {
  const { admin_id } = req;
  if (!admin_id) {
    return next(new AppError("Admin Authentication Failed", 401));
  }
  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return next(new AppError("Invalid Admin Signature"));
  }
  const query = {
    active: true,
  };
  if (req?.body?.status) {
  }
});

// <--------- Volunteer End Here -------------->

// < ------------------- Booking Type --------------->
export const addBookingType = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  let { bookingType, price } = req.body;

  // 🔹 Validation
  if (!bookingType?.trim()) {
    return next(new AppError("Booking type is required", 400));
  }

  if (price === undefined || price === null) {
    return next(new AppError("Booking price is required", 400));
  }

  if (isNaN(price) || Number(price) < 0) {
    return next(new AppError("Invalid booking price", 400));
  }

  // 🔹 Normalize input
  bookingType = bookingType.trim().toLowerCase();

  // 🔹 Check duplicate
  const existing = await bookingTypemodel.findOne({
    bookingType,
    isDelete: false,
  });
  if (existing) {
    return next(new AppError("Booking type already exists", 409));
  }

  // 🔹 Create
  const result = await bookingTypemodel.create({
    bookingType,
    price: Number(price),
  });

  return sendSuccess(res, "Booking type added successfully", {}, 201, true);
});

export const updateBookingType = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;
  let { bookingType, price } = req.body;

  // 🔹 Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid booking type ID", 400));
  }

  // 🔹 Validation
  if (!bookingType?.trim()) {
    return next(new AppError("Booking type is required", 400));
  }

  if (price === undefined || price === null) {
    return next(new AppError("Booking price is required", 400));
  }

  if (isNaN(price) || Number(price) < 0) {
    return next(new AppError("Invalid booking price", 400));
  }

  // 🔹 Normalize
  bookingType = bookingType.trim().toLowerCase();

  // 🔹 Check duplicate (exclude current id)
  const existing = await bookingTypemodel.findOne({
    bookingType,
    _id: { $ne: id },
  });

  if (existing) {
    return next(new AppError("Booking type already exists", 409));
  }

  // 🔹 Update
  const result = await bookingTypemodel.findByIdAndUpdate(
    id,
    {
      bookingType,
      price: Number(price),
    },
    { new: true, runValidators: true },
  );

  if (!result) {
    return next(new AppError("Booking type not found", 404));
  }

  return sendSuccess(res, "Update successful", result, 200, true);
});

// booking type soft delete
export const deleteBookingType = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }
  const { b_id } = req.query;
  if (!b_id) {
    return next(new AppError("booking credential missing", 400));
  }
  const result = await bookingTypemodel.findByIdAndUpdate(
    { _id: b_id },
    { isDelete: true },
    { upsert: true, new: true },
  );
  if (!result) {
    return next(new AppError("failed to delete", 400));
  }
  return sendSuccess(res, "delete succesfull", {}, 201, true);
});

// get all booking types
export const getAllBookingTypes = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  // Pagination (important for scaling)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Fetch data
  const result = await bookingTypemodel
    .find({ isDelete: false })
    .select("bookingType price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await bookingTypemodel.countDocuments({ isDelete: false });

  return sendSuccess(
    res,
    "success",
    {
      data: result,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    },
    200,
    true,
  );
});

export const getSingleBookingType = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }
  const { b_id } = req.query;
  if (!b_id) {
    return next(new AppError("booking credential missing", 400));
  }
  const result = await bookingTypemodel
    .findOne({ _id: b_id, isDelete: false })
    .select("-__v -createdAt -updatedAt");
  if (!result) {
    return next(new AppError("booking not found", 200));
  }
  return sendSuccess(res, "success", result, 200, true);
});

// <----------- VENUE and Address -------------->
export const addVenueController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { venue, address, image } = req.body;
  const requiredField = ["venue", "address", "image"];
  const missingFields = requiredField.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );
  if (missingFields) {
    return next(new AppError(`${missingFields} missing`, 400));
  }
  const payload = {
    venue,
    address,
    image,
  };
  const result = await venueModel.create(payload);
  if (!result) {
    return next(new AppError("failed to add venue", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

export const updateVenueController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;
  const { venue, address, image } = req.body;

  // Validate id
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid or missing id", 400));
  }

  // Check if at least one field is provided
  if (!venue && !address && !image) {
    return next(new AppError("At least one field is required to update", 400));
  }

  // Prepare update payload (only send provided fields)
  const payload = {};
  if (venue) payload.venue = venue;
  if (address) payload.address = address;
  if (image) payload.image = image;

  const updatedVenue = await venueModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedVenue) {
    return next(new AppError("Venue not found or update failed", 404));
  }

  return sendSuccess(
    res,
    "Venue updated successfully",
    updatedVenue,
    200,
    true,
  );
});

export const deleteVenueController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;
  if (!id) {
    return next(new AppError("venue id missing", 400));
  }
  const result = await venueModel.updateOne(
    { _id: id },
    { $set: { isDelete: true } },
  );
  if (result.modifiedCount === 0) {
    return next(new AppError("failed to delete", 400));
  }
  return sendSuccess(res, "success", {}, 201, true);
});

export const getSingleVenueDetailsController = catchAsync(
  async (req, res, next) => {
    const adminId = req.admin_id;

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppError("Admin authentication failed", 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError("venue id missing", 400));
    }
    const result = await venueModel.findOne({ _id: id, isDelete: false });
    if (!result) {
      return next(new AppError("venue not found", 400));
    }
    return sendSuccess(res, "success", {}, 200, true);
  },
);

// < ------------- Venue end -------------->

// < ------------- Category Start ------------>
export const addCategoryController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }
  const { categoryName, picture } = req.body;
  if (!categoryName || !picture) {
    return next(new AppError(`caetgory details missing`, 400));
  }
  const result = await categoryModel.create({ categoryName, picture });
  if (!result) {
    return next(new AppError("failed to add", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});
export const getSingleCategoryController = catchAsync(
  async (req, res, next) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid category id", 400));
    }

    const category = await categoryModel.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    return sendSuccess(
      res,
      "Category fetched successfully",
      category,
      200,
      true,
    );
  },
);
export const getAllCategoryController = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  // convert to number
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    categoryModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    categoryModel.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return sendSuccess(
    res,
    "Categories fetched successfully",
    {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    },
    200,
    true,
  );
});

export const updateCategoryController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  //  Admin check
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;
  const { categoryName, picture } = req.body;

  //  Validate category ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid category id", 400));
  }

  //  Check if at least one field is provided
  if (!categoryName && !picture) {
    return next(new AppError("Nothing to update", 400));
  }

  //  Update
  const updatedCategory = await categoryModel.findByIdAndUpdate(
    id,
    {
      ...(categoryName && { categoryName }),
      ...(picture && { picture }),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedCategory) {
    return next(new AppError("Category not found", 404));
  }

  return sendSuccess(
    res,
    "Category updated successfully",
    updatedCategory,
    200,
    true,
  );
});

export const deleteCategoryController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  //  Admin check
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;

  //  Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid category id", 400));
  }

  const deletedCategory = await categoryModel.findByIdAndDelete(id);

  if (!deletedCategory) {
    return next(new AppError("Category not found", 404));
  }

  return sendSuccess(res, "Category deleted successfully", {}, 200, true);
});
// < ------------- Category End --------------->
