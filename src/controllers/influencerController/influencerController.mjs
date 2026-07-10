import mongoose from "mongoose";
import InfluencerModel from "../../models/influencerModel/influencerModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../../utils/handler.mjs";
import { influencerStatusMail } from "../../config/bravoConfig.mjs";


// influencer request start from here
export const requestInfluencer = catchAsync(async (req, res, next) => {
    const { firstName, lastName, phone, email, gender, address, profilePicture } = req.body;

    const exists = await InfluencerModel.findOne({
        $or: [
            { phone },
            { email }
        ]
    });

    if (exists) {
        return next(new AppError("You have already requested to be an influencer", 409));
    }

    await InfluencerModel.create({
        firstName,
        lastName,
        phone,
        email,
        gender,
        address,
        profilePicture
    });

    return sendSuccess(
        res,
        "Your request has been sent successfully",
        {},
        201,
        true
    );
});

// influencer request ends here


// get all influencer request start from here....
export const getAllInfluencerRequest = catchAsync(async (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;
    const { search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const query = {};

    if (search && search.trim() !== "") {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { "address.city": { $regex: search, $options: "i" } },
            { "address.state": { $regex: search, $options: "i" } },
        ];
    }

    const [allRequest, total] = await Promise.all([
        InfluencerModel.find(query).select("-__v -updatedAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        InfluencerModel.countDocuments(query),
    ]);

    return sendSuccess(
        res,
        "All requests fetched successfully",
        {
            data: allRequest,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        },
        200,
        true
    );
});

// get all influencer request ended here....

// get single influencer details
export const getSingleIncluencer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid influencer ID', 400));
    }
    const influencer = await InfluencerModel.findById(id);
    if (!influencer) {
        return next(new AppError('Influencer not found', 404));
    }
    return sendSuccess(res, "Influencer fetched successfully", influencer, 200, true);
});

// single influencer delete request
export const deleteInfluencer = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const influencer = await InfluencerModel.findByIdAndDelete(id);
    if (!influencer) {
        return next(new AppError('Influencer not found', 404));
    }
    return sendSuccess(res, "Influencer deleted successfully", {}, 200, true);
})

// single influencer delete request end...


// Multiple influencer delete request start

export const MultipleInfluencerDelete = catchAsync(async (req, res, next) => {
    const { ids } = req.body;
    const result = await InfluencerModel.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, "Influencers deleted successfully", {}, 200, true);
})

// Multiple influencer delete request end

export const approveRejectInfluencer = catchAsync(async (req, res, next) => {
    const { id } = req?.query;
    const status = req?.query?.status;
    const influencer = await InfluencerModel.findById(id);
    if (!influencer) {
        return next(new AppError('Influencer not found', 404));
    }
    if (influencer.status === status) {
        return next(new AppError('Status already updated', 400));
    }
    await InfluencerModel.findByIdAndUpdate(id, { status }, { new: true });
    // send email template //
    await influencerStatusMail(influencer.firstName + " " + influencer.lastName, influencer.email, status);
    return sendSuccess(res, "Influencer status updated successfully", {}, 200, true);
})
