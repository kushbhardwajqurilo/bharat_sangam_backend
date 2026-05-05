import contactModel from "../models/contactModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../utils/handler.mjs";

// query add
export const contactController = catchAsync(async (req, res, next) => {
  const requiredFields = ["fullName", "email", "phone", "query"];
  const missingField = requiredFields.find(
    (field) => !req.body || req.body.toString().trim().length === "",
  );

  if (missingField) {
    return next(new AppError(`${missingField} missing`));
  }
  const { fullName, email, phone, query } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError("Invalid Email Format", 400));
  }
  const payload = {
    fullName: fullName.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    phone: phone.toLowerCase().trim(),
    query: query.toLowerCase().trim(),
  };
  const result = await contactModel.create(payload);
  if (!result) {
    return next(new AppError("failed to sumbit", 400));
  }
  return sendSuccess(res, "success", {}, 200, true);
});

// get  all query
export const getAllQuery = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  const { search } = req.query;
  console.log("search", search);
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;
  let pipeline = [];
  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { query: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // without search pipelines
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  );
  let countQuery = {};

  if (search && search.trim() !== "") {
    countQuery = {
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { query: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };
  }
  const [queries, total] = await Promise.all([
    contactModel.aggregate(pipeline),
    contactModel.countDocuments(countQuery),
  ]);
  console.log("total", total);
  const totalPages = Math.ceil(total / limit);
  // console.log("final", queries);
  const finalData = queries.map(
    ({ fullName, phone, createdAt, updatedAt, __v, ...rest }) => ({
      ...rest,
      name: fullName,
      contact: phone,
    }),
  );
  return sendSuccess(
    res,
    "query found",
    {
      data: finalData,
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

// get single query
export const getSingleQueryController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid query id", 400));
  }
  const query = await contactModel.findOne({ _id: id });
  if (!query) {
    return next(new AppError("query not found", 400));
  }
  const finalData = {
    _id: query?._id,
    name: query?.fullName,
    contact: query?.phone,
    query: query?.query,
    email: query?.email,
  };
  return sendSuccess(res, "success", finalData, 200, true);
});
