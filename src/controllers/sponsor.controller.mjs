import sponsorModel from "../models/sponsorModel.js";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

export const createSponsor = catchAsync(async (req, res) => {
  const {
    fullName,
    companyName,
    email,
    phone,
    designation,
    websiteOrInstagram,
    sponsorshipInterest,
    estimatedBudgetRange,
    productServiceContribution,
    additionalMessage,
  } = req.body;

  console.log("body", req.body);
  const sponsor = await sponsorModel.create({
    fullName,
    companyName,
    email,
    phone,
    designation,
    websiteOrInstagram,
    sponsorshipInterest,
    estimatedBudgetRange,
    productServiceContribution,
    additionalMessage,
  });
  if (!sponsor) {
    return next(new AppError("Request failed please try again later", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

export const getSponsors = catchAsync(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = Number(page);
  limit = Number(limit);

  const query = {
    fullName: { $regex: search, $options: "i" },
    email: { $regex: search, $options: "i" },
  };

  const sponsors = await sponsorModel
    .find(query)
    .select("-__v -updatedAt")
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
  const { id } = req.params;
  const { status } = req.body;
  const sponsor = await sponsorModel.findByIdAndUpdate(
    id,
    { $set: { status: status } },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!sponsor) {
    return next(new AppError(`Unable to ${status} sponsor`, 400));
  }
  return sendSuccess(res, "success", {}, 201, true);
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
