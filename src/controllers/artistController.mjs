import mongoose, { mongo } from "mongoose";
import artistModel from "../models/artistMode.js";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const addArtistController = catchAsync(async (req, res, next) => {
  console.log("artist body", req.body);
  const {
    artistName,
    profileImage,
    aboutArtist,
    email,
    contactNo,
    startTime,
    endTime,
    instruments,
    galleryImages,
  } = req.body;
  // 🔹 Basic validation
  if (!artistName?.trim()) {
    return next(new AppError("artistName is required", 400));
  }

  if (!email?.trim()) {
    return next(new AppError("email is required", 400));
  }

  if (!contactNo?.trim()) {
    return next(new AppError("contactNo is required", 400));
  }

  if (!Array.isArray(instruments) || instruments.length === 0) {
    return next(new AppError("instruments must be a non-empty array", 400));
  }

  if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
    return next(new AppError("gallery must be a non-empty array", 400));
  }

  // 🔹 Email format check
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid email format", 400));
  }

  // 🔹 Duplicate check
  const existingArtist = await artistModel.findOne({ email });
  if (existingArtist) {
    return next(new AppError("Artist with this email already exists", 400));
  }

  // 🔹 Create artist
  const artist = await artistModel.create({
    artistName,
    profileImage,
    about: aboutArtist,
    email,
    contactNo,
    startTime,
    endTime,
    instruments,
    galleryImages,
  });

  return sendSuccess(res, "Artist added successfully", {}, 201, true);
});

// <-------- update artist controller --------->
export const updateArtistController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const {
    artistName,
    profileImage,
    aboutArtist,
    email,
    contactNo,
    startTime,
    endTime,
    // performanceTime,
    instruments,
    gallery,
    isActive = true,
  } = req.body;
  const about = aboutArtist;
  // 🔹 Check artist exists
  const artist = await artistModel.findById(id);
  if (!artist) {
    return next(new AppError("Artist not found", 404));
  }

  // 🔹 Email validation (if updating)
  if (email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError("Invalid email format", 400));
    }

    // 🔹 Duplicate email check (exclude current artist)
    const existingArtist = await artistModel.findOne({
      email,
      _id: { $ne: id },
    });

    if (existingArtist) {
      return next(new AppError("Email already in use", 400));
    }
  }

  // 🔹 Array validations (optional but safe)
  if (
    instruments &&
    (!Array.isArray(instruments) || instruments.length === 0)
  ) {
    return next(new AppError("instruments must be a non-empty array", 400));
  }

  if (gallery && (!Array.isArray(gallery) || gallery.length === 0)) {
    return next(new AppError("gallery must be a non-empty array", 400));
  }

  // 🔹 Update only provided fields
  const updatedArtist = await artistModel.findByIdAndUpdate(
    id,
    {
      ...(artistName && { artistName }),
      ...(profileImage && { profileImage }),
      ...(about && { about }),
      ...(email && { email }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(contactNo && { contactNo }),
      ...(instruments && { instruments }),
      ...(gallery && { gallery }),
    },
    { new: true, runValidators: true },
  );

  return sendSuccess(
    res,
    "Artist updated successfully",
    updatedArtist,
    200,
    true,
  );
});

// get single artis details
export const getArtistDetails = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid artist ID", 400));
  }

  const result = await artistModel
    .findOne({ _id: id, isActive: true })
    .select("-__v") // remove unwanted fields
    .lean(); // performance boost
  if (!result) {
    return next(new AppError("Artist not found", 404));
  }
  const finalData = {
    _id: result?._id,
    artistName: result?.artistName,
    profileImage: result?.profileImage,
    aboutArtist: result?.about,
    email: result?.email,
    contactNo: result?.contactNo,
    startTime: result?.startTime,
    endTime: result?.endTime,
    instruments: result?.instruments,
    galleryImages: result?.galleryImages,
  };
  return sendSuccess(res, "success", finalData, 200, true);
});

export const getAllArtistList = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  // 🔹 Auth check (if admin-only API)
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  // 🔹 Query params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  const skip = (page - 1) * limit;

  // 🔹 Search filter
  const searchFilter = search
    ? {
        artistName: { $regex: search, $options: "i" },
      }
    : {};

  // 🔹 Main query
  const filter = {
    isActive: true,
    ...searchFilter,
  };

  const artists = await artistModel
    .find(filter)
    .select(
      "artistName  email contactNo profileImage about startTime endTime instruments galleryImages",
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const finalData = artists.map(({ about, ...rest }) => ({
    ...rest,
    aboutArtist: about,
  }));
  const total = await artistModel.countDocuments(filter);

  return sendSuccess(
    res,
    "Artist list fetched successfully",
    {
      data: finalData,
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

// delete but not permanently
export const deleteArtistController = catchAsync(async (req, res, next) => {
  const adminId = req.admin_id;

  // 🔹 Auth check
  if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
    return next(new AppError("Admin authentication failed", 401));
  }

  const { id } = req.params;

  // 🔹 Validate artist ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid artist ID", 400));
  }

  // 🔹 Soft delete
  const result = await artistModel.findOneAndUpdate(
    { _id: id, isActive: true },
    { isActive: false },
    { new: true },
  );

  if (!result) {
    return next(new AppError("Artist not found or already deleted", 404));
  }

  return sendSuccess(res, "Artist deleted successfully", {}, 200, true);
});
