import mongoose from "mongoose";
import artistModel from "../models/artistMode.js";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";
import { artistRequestMail, artistStatusMail } from "../config/bravoConfig.mjs";
import jwt from "jsonwebtoken";

// Helper function to verify admin token optionally for public/admin dual endpoints
async function verifyAdmin(authHeader) {
  if (!authHeader) return false;
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    return decoded?.role === "admin";
  } catch (error) {
    return false;
  }
}

// 1. POST /artist (Public or Admin Creation)
export const addArtistController = catchAsync(async (req, res, next) => {
  let {
    artistName,
    firstName,
    lastName,
    role,
    aboutArtist,
    about,
    profileImage,
    profilePicture,
    email,
    contactNo,
    phone,
    gender = "other",
    address = {},
    socialLinks = {},
    instruments = [],
    startTime = "",
    endTime = "",
    galleryImages = [],
    status,
    isActive = true,
  } = req.body;

  // Backwards compatibility mappings
  if (!artistName && (firstName || lastName)) {
    artistName = `${firstName || ""} ${lastName || ""}`.trim();
  }
  if (!contactNo && phone) {
    contactNo = phone;
  }
  if (!profileImage && profilePicture) {
    profileImage = profilePicture;
  }
  if (!aboutArtist && about) {
    aboutArtist = about;
  }

  // Fallback defaults / checks
  if (!artistName?.trim()) {
    return next(new AppError("artistName is required", 400));
  }
  if (!role?.trim()) {
    role = "Artist";
  }
  if (!aboutArtist?.trim()) {
    aboutArtist = "Artist bio";
  }
  if (!profileImage?.trim()) {
    profileImage = "_blank.png";
  }
  if (!email?.trim()) {
    return next(new AppError("email is required", 400));
  }
  if (!contactNo?.trim()) {
    return next(new AppError("contactNo is required", 400));
  }

  // Check duplicate artist by email or contactNo
  const existingArtist = await artistModel.findOne({
    $or: [{ email: email.toLowerCase().trim() }, { contactNo: contactNo.trim() }],
  });
  if (existingArtist) {
    return next(new AppError("Artist with this email or contact number already exists", 409));
  }

  // Determine status: if explicitly passed or admin caller, honor/default accordingly
  const isAdmin = await verifyAdmin(req.headers["authorization"]);
  const finalStatus = status ? status : isAdmin ? "approved" : "pending";

  const artist = await artistModel.create({
    artistName: artistName.trim(),
    role: role.trim(),
    aboutArtist: aboutArtist.trim(),
    profileImage: profileImage.trim(),
    email: email.toLowerCase().trim(),
    contactNo: contactNo.trim(),
    gender,
    address,
    socialLinks,
    instruments,
    startTime,
    endTime,
    galleryImages,
    status: finalStatus,
    isActive,
  });

  if (!artist) {
    return next(new AppError("Failed to create artist request", 400));
  }

  // Trigger transactional email
  try {
    if (finalStatus === "pending") {
      await artistRequestMail(artist.artistName, artist.email);
    } else {
      await artistStatusMail(artist.artistName, artist.email, finalStatus);
    }
  } catch (err) {
    console.error("Artist email notification failed:", err);
  }

  return sendSuccess(
    res,
    finalStatus === "approved"
      ? "Artist added successfully"
      : "Artist request submitted successfully",
    artist,
    201,
    true,
  );
});

// 2. GET /artist (Admin Listing with filters & pagination)
export const getAllArtistList = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    status = "all",
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  // Status filtering
  if (status && status !== "all") {
    query.status = status;
  }

  // Search filter
  if (search && search.trim() !== "") {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    query.$or = [
      { artistName: searchRegex },
      { email: searchRegex },
      { contactNo: searchRegex },
      { role: searchRegex },
      { "address.city": searchRegex },
      { "address.state": searchRegex },
    ];
  }

  // Sort criteria
  const sortDirection = order === "asc" || order === "1" ? 1 : -1;
  const sortOption = { [sortBy]: sortDirection };

  const [artists, total] = await Promise.all([
    artistModel
      .find(query)
      .select("-__v")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    artistModel.countDocuments(query),
  ]);

  return sendSuccess(
    res,
    "Artists fetched successfully",
    {
      data: artists,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
    200,
    true,
  );
});

// 3. GET /artist/:id (Single Artist Fetch)
export const getArtistDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid artist ID", 400));
  }

  const artist = await artistModel.findById(id).select("-__v").lean();
  if (!artist) {
    return next(new AppError("Artist not found", 404));
  }

  return sendSuccess(res, "Artist fetched successfully", artist, 200, true);
});

// 4. PATCH /artist/:id/status or PATCH /artist (Approve / Reject Status Update)
export const updateArtistStatusController = catchAsync(async (req, res, next) => {
  const id = req.params.id || req.query.id || req.body.id;
  const status = req.body.status || req.query.status;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid or missing artist ID", 400));
  }

  if (!["pending", "approved", "rejected"].includes(status)) {
    return next(new AppError("Status must be 'pending', 'approved', or 'rejected'", 400));
  }

  const artist = await artistModel.findById(id);
  if (!artist) {
    return next(new AppError("Artist not found", 404));
  }

  if (artist.status === status) {
    return sendSuccess(res, "Artist request updated successfully", artist, 200, true);
  }

  artist.status = status;
  await artist.save();

  // Trigger status email notification
  try {
    await artistStatusMail(artist.artistName, artist.email, status);
  } catch (err) {
    console.error("Artist status email send error:", err);
  }

  return sendSuccess(
    res,
    "Artist request updated successfully",
    artist,
    200,
    true,
  );
});

// 5. PUT /artist/:id (Admin Update Artist Record)
export const updateArtistController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid artist ID", 400));
  }

  const artist = await artistModel.findById(id);
  if (!artist) {
    return next(new AppError("Artist not found", 404));
  }

  const {
    artistName,
    role,
    aboutArtist,
    about,
    profileImage,
    profilePicture,
    email,
    contactNo,
    phone,
    gender,
    address,
    socialLinks,
    instruments,
    startTime,
    endTime,
    galleryImages,
    status,
    isActive,
  } = req.body;

  // Check email uniqueness if modified
  if (email && email.toLowerCase().trim() !== artist.email) {
    const existing = await artistModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: id },
    });
    if (existing) {
      return next(new AppError("Email already in use by another artist", 409));
    }
    artist.email = email.toLowerCase().trim();
  }

  // Check contactNo uniqueness if modified
  const newContact = contactNo || phone;
  if (newContact && newContact.trim() !== artist.contactNo) {
    const existing = await artistModel.findOne({
      contactNo: newContact.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      return next(new AppError("Contact number already in use by another artist", 409));
    }
    artist.contactNo = newContact.trim();
  }

  if (artistName) artist.artistName = artistName.trim();
  if (role) artist.role = role.trim();
  if (aboutArtist || about) artist.aboutArtist = (aboutArtist || about).trim();
  if (profileImage || profilePicture) artist.profileImage = (profileImage || profilePicture).trim();
  if (gender) artist.gender = gender;
  if (address) artist.address = { ...artist.address, ...address };
  if (socialLinks) artist.socialLinks = { ...artist.socialLinks, ...socialLinks };
  if (Array.isArray(instruments)) artist.instruments = instruments;
  if (startTime !== undefined) artist.startTime = startTime;
  if (endTime !== undefined) artist.endTime = endTime;
  if (Array.isArray(galleryImages)) artist.galleryImages = galleryImages;
  if (status) artist.status = status;
  if (isActive !== undefined) artist.isActive = isActive;

  await artist.save();

  return sendSuccess(res, "Artist updated successfully", artist, 200, true);
});

// 6. DELETE /artist/:id (Delete Artist Record)
export const deleteArtistController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid artist ID", 400));
  }

  const artist = await artistModel.findByIdAndDelete(id);
  if (!artist) {
    return next(new AppError("Artist not found", 404));
  }

  return sendSuccess(res, "Artist deleted successfully", {}, 200, true);
});

// Backward compatibility alias exports for any legacy consumers
export const artistRequest = addArtistController;
export const getAllArtistRequest = getAllArtistList;
export const getSingleArtistRequest = getArtistDetails;
export const approveRejectArtistRequest = updateArtistStatusController;
