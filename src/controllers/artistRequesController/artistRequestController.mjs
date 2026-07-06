import ArtistRequestModel from "../../models/artistRequesModel/artistRequestModel.mjs";
import { AppError, catchAsync, sendSuccess } from "../../utils/handler.mjs";


export const artistRequest = catchAsync(async (req, res, next) => {
    const { firstName, lastName, phone, email, gender, profilePicture } = req.body;
    const exist = await ArtistRequestModel.findOne({ $or: [{ email }, { phone }] })
    if (exist) {
        throw new AppError("Artist request already exists", 400);
    }
    const artist = await ArtistRequestModel.create({ firstName, lastName, phone, email, gender, profilePicture });
    sendSuccess(res, "Artist request created successfully", artist, 201);
})

export const getAllArtistRequest = catchAsync(async (req, res, next) => {
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
        ];
    }

    const [allRequest, total] = await Promise.all([
        ArtistRequestModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        ArtistRequestModel.countDocuments(query),
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
})