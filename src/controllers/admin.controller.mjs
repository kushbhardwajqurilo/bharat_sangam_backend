import adminModel from "../models/adminModel.js";
import tokenModel from "../models/tokenModel.mjs";
import volunteerModel from "../models/volunteerModel.mjs";
import { sendForgetTemplateEmail } from "../config/mail.config.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import { compareHashPassword, hashPassword } from "../utils/hashPash.mjs";
import jwt from "jsonwebtoken";
import { generatePassword } from "../utils/randomPasswordGenerate.mjs";
import bookingTypemodel from "../models/bookingType.mjs";
import mongoose, { mongo } from "mongoose";
import venueModel from "../models/venueModel.js";
import categoryModel from "../models/categoryModel.js";
import { pipeline } from "stream";
import {
  personalMailMessage,
  volunteerEmailSend,
} from "../config/bravoConfig.mjs";
import statusVideosModel from "../models/statusVideosModel.js";
import cloudinaryConfig from "../config/cloudinary.mjs";

// ================= TOKEN FUNCTIONS =================

// ✅ Access Token
const generateAccessToken = (data) => {
  return jwt.sign(
    {
      id: data.admin_id,
      role: data.role,
    },
    process.env.ACCESS_SECRET,
    { expiresIn: "24h" },
  );
};

//  Refresh Token (DB stored)
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
  console.log("login request hit");
  const rquriedFields = ["email", "password"];

  const missingFields = rquriedFields.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingFields) {
    console.log("missing Field", missingFields);
    return next(new AppError(`${missingFields} is missing`, 400));
  }

  const { email, password } = req.body;

  try {
    const admin = await adminModel
      .findOne({ email })
      .select("_id email password role");

    if (!admin) {
      console.log("admin email not found");
      return next(new AppError("Email not exist", 400));
    }

    const isMatch = await compareHashPassword(password, admin.password);

    if (!isMatch) {
      console.log("invalid password");
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
  } catch (error) {
    console.log("Internal server Error:", error);
  }
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
  const requiredFields = ["name", "email", "contact", "profilePicture", "role"];

  const missingField = requiredFields.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );

  if (missingField) {
    return next(new AppError(`${missingField} is missing`, 400));
  }

  const { name, email, contact, profilePicture, role } = req.body;

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
    contact,
    profilePicture,
    role,
  });
  if (!volunteer) {
    return next(new AppError("failed to add volunteer", 400));
  }

  const sendMail = await volunteerEmailSend(name, email, password);
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
  if (!isValunteer?.isActive) {
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
export const disableVolunteer = catchAsync(async (req, res, next) => {
  const { admin_id } = req;
  const { id } = req.params;
  const { disable } = req.body;
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
  const result = await volunteerModel.findByIdAndUpdate(id, {
    $set: { isActive: !disable },
  });
  if (!result) {
    return next(new AppError("taks failed", 400));
  }
  return sendSuccess(res, "success", {}, 201, true);
});

// get all volunteer
export const getAllVolunteerController = catchAsync(async (req, res, next) => {
  const { admin_id } = req;
  const { search } = req.query;

  if (!admin_id) {
    return next(new AppError("Admin Authentication Failed", 401));
  }

  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return next(new AppError("Invalid Admin Signature"));
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  //  pipeline
  let pipeline = [];

  //  Search condition
  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { contact: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Sorting + Pagination
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    // Remove unwanted fields
    {
      $project: {
        password: 0,
        __v: 0,
        updatedAt: 0,
      },
    },
  );

  //  Count query (for pagination)
  let countQuery = {};
  if (search && search.trim() !== "") {
    countQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { contact: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
    ];
  }

  const [result, total] = await Promise.all([
    volunteerModel.aggregate(pipeline),
    volunteerModel.countDocuments(countQuery),
  ]);

  if (!result) {
    return next(new AppError("No volunteers found", 404));
  }

  return sendSuccess(
    res,
    "success",
    {
      data: result,
      pagination: {
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    },
    200,
    true,
  );
});

// get single volunteer
export const getSingleVolunteer = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid volunteer id", 400));
  }
  const result = await volunteerModel
    .findOne({ _id: id })
    .select("-__v -password -createdAt -updatedAt")
    .lean();

  if (!result) {
    return next(new AppError("data not found", 400));
  }
  return sendSuccess(res, "success", result, 200, true);
});

// update volunteer
export const updateVolunteer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError("volunteer id missing", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid volunteer id", 400));
  }
  const { name, email, role, contact, profilePicture } = req.body;
  const result = await volunteerModel.findByIdAndUpdate(
    id,
    {
      ...(name && { name }),
      ...(email && { email }),
      ...(contact && { contact }),
      ...(profilePicture && { profilePicture }),
      ...(role && { role }),
    },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!result) {
    return next(new AppError("volunteer not found", 400));
  }
  return sendSuccess(res, "updaet complete", {}, 201, true);
});

// <--------- Volunteer End Here -------------->

// < ------------------- Booking Type --------------->
export const addBookingType = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  let {
    bookingType,
    price,
    subtitle = "General Entry",
    isPopular = false,
    features = [],
  } = req.body;

  console.log("booking type body", req.body);
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
    subtitle,
    isPopular,
    features,
  });
  if (!result) {
    return next(new AppError("Failed to add bookin type", 400));
  }
  return sendSuccess(res, "Booking type added successfully", {}, 201, true);
});

export const updateBookingType = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;
  let { bookingType, price, subtitle, isPopular, features } = req.body;

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
      subtitle,
      isPopular,
      features,
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
  const { isDelete } = req.body;
  const { id } = req.params;
  if (!id) {
    return next(new AppError("booking credential missing", 400));
  }
  if (isDelete === "" || isDelete === null || isDelete === undefined) {
    return next(new AppError("Status required", 400));
  }
  const result = await bookingTypemodel.findByIdAndUpdate(
    { _id: id },
    { isDelete },
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
    .find({})
    .select("-createdAt -updatedAt -__v")
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
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
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
  const { id } = req.params;
  if (!id) {
    return next(new AppError("booking credential missing", 400));
  }
  const result = await bookingTypemodel
    .findOne({ _id: id, isDelete: false })
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

  const { venue, address, image, city } = req.body;
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
    city,
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
  const { venue, address, image, city } = req.body;

  // Validate id
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid or missing id", 400));
  }

  // Check if at least one field is provided
  if (!venue && !address && !image && !city) {
    return next(new AppError("At least one field is required to update", 400));
  }

  // Prepare update payload (only send provided fields)
  const payload = {};
  if (venue) payload.venue = venue;
  if (address) payload.address = address;
  if (image) payload.image = image;
  if (city) payload.city = city;

  const updatedVenue = await venueModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedVenue) {
    return next(new AppError("Venue not found or update failed", 404));
  }

  return sendSuccess(res, "Venue updated successfully", {}, 200, true);
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
    { $set: { isActive: true } },
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
    const result = await venueModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "venueName",
          as: "events",
        },
      },

      {
        $addFields: {
          totalEvents: { $size: "$events" },
        },
      },
      {
        $project: {
          venue: 1,
          address: 1,
          image: 1,
          _id: 1,
          city: 1,
          events: "$totalEvents",
          isActive: "$isActive",
        },
      },
    ]);
    if (!result) {
      return next(new AppError("venue not found", 400));
    }
    return sendSuccess(res, "success", result[0], 200, true);
  },
);

// export const getAllVanueList = catchAsync(async (req, res, next) => {
//   const adminId = req.admin_id;
//   if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
//     return next(new AppError("Admin authentication failed", 401));
//   }

//   // Pagination (important for scaling)
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   // Fetch data
//   const [result, total] = await Promise.all([
//     venueModel.aggregate([
//       { $sort: { created: -1 } },
//       { $skip: skip },
//       { $limit: limit },

//       {
//         $lookup: {
//           from: "events",
//           localField: "_id",
//           foreignField: "venueName",
//           as: "events",
//         },
//       },

//       {
//         $addFields: {
//           totalEvents: { $size: "$events" },
//         },
//       },
//       {
//         $project: {
//           venue: 1,
//           address: 1,
//           image: 1,
//           _id: 1,
//           city: 1,
//           events: "$totalEvents",
//           isActive: "$isActive",
//         },
//       },
//     ]),
//   ]);
//   // const result = await venueModel
//   //   .find({ isDelete: false })
//   //   .select("venue address image _id city")
//   //   .sort({ createdAt: -1 })
//   //   .skip(skip)
//   //   .limit(limit);

//   // const total = await bookingTypemodel.countDocuments({ isDelete: false });

//   return sendSuccess(
//     res,
//     "success",
//     {
//       data: result,
//       pagination: {
//         total,
//         page,
//         pages: Math.ceil(total / limit),
//       },
//     },
//     200,
//     true,
//   );
// });

export const getAllVanueList = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;
  const { search } = req.query;
  // console.log("search", search);
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build pipeline dynamically
  let pipeline = [];

  //  Apply search ONLY if provided
  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        $or: [
          { venue: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  //  aggregation
  pipeline.push(
    { $sort: { created: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "venueName",
        as: "events",
      },
    },
    {
      $addFields: {
        totalEvents: { $size: "$events" },
      },
    },
    {
      $project: {
        venue: 1,
        address: 1,
        image: 1,
        _id: 1,
        city: 1,
        events: "$totalEvents",
        isActive: 1,
      },
    },
  );

  //  Count query (same condition)
  let countQuery = {};
  if (search && search.trim() !== "") {
    countQuery = {
      $or: [
        { venue: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ],
    };
  }

  const [result, total] = await Promise.all([
    venueModel.aggregate(pipeline),
    venueModel.countDocuments(countQuery),
  ]);

  return sendSuccess(
    res,
    "success",
    {
      data: result,
      pagination: {
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    },
    200,
    true,
  );
});

export const statusUpdateVenueController = catchAsync(
  async (req, res, next) => {
    console.log("disable", req.body);
    const adminId = req.admin_id;
    const { disable } = req.body;

    //  Admin check
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppError("Admin authentication failed", 401));
    }

    const { id } = req.params;

    //  Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid category id", 400));
    }

    const deletedCategory = await venueModel.findByIdAndUpdate(id, {
      $set: { isActive: !disable },
    });

    if (!deletedCategory) {
      return next(new AppError("Venue not found", 404));
    }

    return sendSuccess(
      res,
      `Venue ${disable ? "enable" : "disable"} successfully`,
      {},
      200,
      true,
    );
  },
);

// < ------------- Venue end -------------->

// < ------------- Category Start ------------>
export const addCategoryController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;
  const { search } = req.query;
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }
  const { categoryName, picture } = req.body;
  if (!categoryName || !picture) {
    return next(new AppError(`caetgory details missing`, 400));
  }
  const result = await categoryModel.create({
    categoryName: categoryName.toLowerCase(),
    picture,
  });
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

    const category = await categoryModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "category",
          as: "events",
        },
      },

      {
        $addFields: {
          totalEvents: { $size: "$events" },
        },
      },

      {
        $project: {
          _id: 1,
          categoryName: 1,
          picture: 1,
          totalEvents: 1,
          isActive: "$status",
        },
      },
    ]);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }
    console.log("sngle co", category);
    return sendSuccess(
      res,
      "Category fetched successfully",
      category[0],
      200,
      true,
    );
  },
);
export const getAllCategoryController = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  const { search } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;
  let pipeline = [];
  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        categoryName: { $regex: search, $options: "i" },
      },
    });
  }

  // aggregation

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "category",
        as: "events",
      },
    },

    {
      $addFields: {
        totalEvents: { $size: "$events" },
      },
    },

    {
      $project: {
        _id: 1,
        categoryName: 1,
        picture: 1,
        totalEvents: 1,
        isActive: "$status",
      },
    },
  );
  let countQuery = {};
  if (search && search.trim() !== "") {
    countQuery.categoryName = { $regex: search, $options: "i" };
  }
  const [categories, total] = await Promise.all([
    categoryModel.aggregate(pipeline),
    categoryModel.countDocuments(countQuery),
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
  //
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

  return sendSuccess(res, "Category updated successfully", {}, 200, true);
});

export const statusUpdateCategoryController = catchAsync(
  async (req, res, next) => {
    console.log("disable", req.body);
    const adminId = req.admin_id;
    const { disable } = req.body;

    //  Admin check
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return next(new AppError("Admin authentication failed", 401));
    }

    const { id } = req.params;

    //  Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid category id", 400));
    }

    const deletedCategory = await categoryModel.findByIdAndUpdate(id, {
      $set: { status: !disable },
    });

    if (!deletedCategory) {
      return next(new AppError("Category not found", 404));
    }

    return sendSuccess(
      res,
      `Category ${disable ? "enable" : "disable"} successfully`,
      {},
      200,
      true,
    );
  },
);
// < ------------- Category End --------------->

//  mail send
export const mailSent = catchAsync(async (req, res, next) => {
  // console.log("body data", req?.body);
  const requiredField = ["subject", "message", "recipients"];
  const missingField = requiredField.find(
    (field) => !req.body[field] || req.body[field].toString().trim() === "",
  );
  const safeParse = (val, fallback) => {
    if (!val) return fallback;
    try {
      return JSON.parse(val);
    } catch (e) {
      return fallback;
    }
  };
  // attachment
  const attachment = [];
  let recipient;
  if (typeof req?.body?.recipients === "string") {
    recipient = safeParse(req?.body?.recipients);
  }
  if (req?.files) {
    req?.files.map((file) =>
      attachment.push({
        name: file.originalname,
        base64Content: file.buffer.toString("base64"),
      }),
    );
  }
  const result = await personalMailMessage(
    // req?.body?.receiver_name,
    req?.body?.subject,
    req?.body?.message,
    recipient[0],
    attachment,
  );
  // console.log("mail result", result);
  if (!result) {
    return next(new AppError("Unable to send mail", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

// forget password

export const forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Email Missing", 400));
  }
  const isAdmin = await adminModel.findOne({ email });
  if (!isAdmin) {
    return next(new AppError("Emain Not Found Try Again Later"));
  }
  const token = jwt.sign(
    {
      id: isAdmin._id,
      role: "admin",
    },
    process.env.FORGET_SECRET,
    { expiresIn: "10m" },
  );
  const url =
    process.env.NODE_ENV === "production"
      ? `${process.env.FORGET_URL}?token=${token}`
      : `${process.env.LOCAL_FORGET_URL}?token=${token}`;

  const sent = sendForgetTemplateEmail(email, url);
  return sendSuccess(res, "success", {}, 200, true);
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { password, token } = req.body;
  if (!token) {
    return next(new AppError("token miising", 400));
  }
  if (!password) {
    return next(new AppError("Password Missing", 400));
  }
  try {
    const verify = jwt.verify(token, process.env.FORGET_SECRET);
    // console.log("vei", verify);
    const isAdmin = await adminModel.findOne({ _id: verify.id });
    if (!isAdmin) {
      return next(new AppError("Admin not found"));
    }
    const isAlreadyPasswordExist = await compareHashPassword(
      password,
      isAdmin.password,
    );
    if (isAlreadyPasswordExist) {
      return next(
        new AppError(
          "New password cannot be the same as your old password.",
          400,
        ),
      );
    }
    const hasNewPassword = await hashPassword(password);

    isAdmin.password = hasNewPassword;
    await isAdmin.save();
    return sendSuccess(res, "success", {}, 201, true);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Session Expired. Please Raise Your Request Again", 401),
      );
    }
    return next(new AppError("Invalid Or Malformed Session", 402));
  }
});

/**
 *  video upload service start here
 **/

//save in db
export const addStatusVideo = catchAsync(async (req, res, next) => {
  const { tags, thumbnailUrl, videoUrl } = req.body;
  const insert = await statusVideosModel.create({
    tags,
    thumbnailUrl,
    videoUrl,
  });
  if (!insert) {
    return next(new AppError("unable to insert", 400));
  }
  return sendSuccess(res, "status upload", {}, 200, true);
});

export const getStatusVideo = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, tag, sortBy, order } = req.query;
  console.log({ page, limit, search, tag, sortBy, order });
  const skip = (page - 1) * limit;

  const filter = {};

  // Exact tag match
  if (tag) {
    filter.tags = tag;
  }

  // Search inside tags
  if (search) {
    filter.tags = {
      $elemMatch: {
        $regex: escapeRegex(search),
        $options: "i",
      },
    };
  }
  const sortDirection = order === "asc" ? 1 : -1;

  let sort;

  switch (sortBy) {
    case "oldest":
      sort = {
        createdAt: 1,
        _id: 1,
      };
      break;

    case "downloads":
      sort = {
        downloadCount: sortDirection,
        _id: sortDirection,
      };
      break;

    case "popular":
      sort = {
        downloadCount: sortDirection,
        createdAt: -1,
        _id: -1,
      };
      break;

    case "latest":
    default:
      sort = {
        createdAt: -1,
        _id: -1,
      };
      break;
  }

  const [videos, total] = await Promise.all([
    statusVideosModel
      .find(filter)
      .select(
        "_id tags videoUrl thumbnailUrl downloadsCount createdAt updatedAt",
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    statusVideosModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return sendSuccess(
    res,
    "Status videos fetched successfully",
    {
      data: videos,

      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    },
    200,
    true,
  );
});

export const getSingleStatusVideoDetails = catchAsync(
  async (req, res, next) => {
    const { id } = req.params;
    const result = await statusVideosModel.findOne({ _id: id }).select("-__v");
    if (!result) {
      return next(new AppError("Status video not found.", 400));
    }
    return sendSuccess(res, "Video found.", result, 200, true);
  },
);

export const updateStatusVideoDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { tags, videoUrl, thumbnailUrl } = req.body;

  // Build update object
  const updateData = {};

  if (tags !== undefined) updateData.tags = tags;
  if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
  if (thumbnailUrl !== undefined) {
    updateData.thumbnailUrl = thumbnailUrl;
  }

  // Nothing to update
  if (Object.keys(updateData).length === 0) {
    return next(new AppError("No fields provided for update", 400));
  }
  const result = await statusVideosModel.updateOne(
    { _id: id },
    { $set: updateData },
    { runValidators: true },
  );
  console.log("updated", result);
  // Document doesn't exist
  if (result.matchedCount === 0) {
    return next(new AppError("Status video not found", 404));
  }

  return sendSuccess(res, "Status video updated successfully", {}, 200, true);
});

export const statusVideoDelete = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const resource = await statusVideosModel
    .findOne({ _id: id })
    .select("_id videoUrl")
    .lean();
  if (!resource) {
    return next(new AppError("source not found.", 400));
  }
  const public_id = `uploads${resource.videoUrl.split("uploads")[1].split(".")[0]}`;

  const result = await cloudinaryConfig.uploader.destroy(public_id, {
    resource_type: "video",
    invalidate: true,
  });
  if (result?.result !== "ok") {
    return next(new AppError(`failed to delete file: ${result.result}`, 400));
  }
  await statusVideosModel.deleteOne({ _id: id });
  return sendSuccess(res, "status delete successfully", {}, 201, true);
});

export const statusDownloadCount = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const result = await statusVideosModel.findOneAndUpdate(
    { _id: id },
    { $inc: { downloadsCount: 1 } },
    { new: true },
  );
  return sendSuccess(res, "success", {}, 201, true);
});
/**
 *  video upload service end here
 **/
