import sponsorModel from "../models/sponsorModel.js";
import { AppError, catchAsync } from "../utils/handler.mjs";

export const createSponsor = catchAsync(async (req, res) => {
  const { sponsorName, sponsorIcon } = req.body;
  if (!sponsorName) {
    return next(new AppError("sponsor name is required", 400));
  }
  if (!sponsorIcon) {
    return next(new AppError("sponsor icon is required", 400));
  }
  const sponsor = await sponsorModel.create({ sponsorName, sponsorIcon });
  if (!sponsor) {
    return next(new AppError("failed to add sponsor", 400));
  }
  res.status(201).json({
    success: true,
    data: sponsor,
  });
});

export const getSponsors = catchAsync(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = Number(page);
  limit = Number(limit);

  const query = {
    sponsorName: { $regex: search, $options: "i" },
  };

  const sponsors = await sponsorModel
    .find(query)
    .select("-__v")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await sponsorModel.countDocuments(query);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: sponsors,
  });
});

export const getSingleSponsor = catchAsync(async (req, res) => {
  const sponsor = await sponsorModel.findById(req.params.id).lean();

  if (!sponsor) {
    return res
      .status(404)
      .json({ success: false, message: "Sponsor not found" });
  }

  res.json({ success: true, data: sponsor });
});

export const updateSponsor = catchAsync(async (req, res) => {
  const sponsor = await sponsorModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!sponsor) {
    return res
      .status(404)
      .json({ success: false, message: "Sponsor not found" });
  }

  res.json({ success: true, data: sponsor });
});

export const deleteSponsor = catchAsync(async (req, res) => {
  const sponsor = await sponsorModel.findByIdAndDelete(req.params.id);

  if (!sponsor) {
    return res
      .status(404)
      .json({ success: false, message: "Sponsor not found" });
  }

  res.json({
    success: true,
    message: "Sponsor deleted successfully",
  });
});
