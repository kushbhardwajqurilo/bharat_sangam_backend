import cloudinaryConfig from "../config/cloudinary.mjs";
import { catchAsync } from "./handler.mjs";

export const getVideoUploadSignature = catchAsync(async (req, res) => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "highlights";
    const paramsToSign = {
        timestamp,
        folder,
        resource_type: "video",
    };

    const signature = cloudinaryConfig.utils.api_sign_request(paramsToSign, process.env.CLOUD_SECRET);
    res.json({
        cloudName: process.env.CLOUD_NAME,
        apiKey: process.env.CLOUD_KEY,
        signature,
        timestamp,
        folder
    });
});
export const getTestimonialUploadSignature = catchAsync(async (req, res) => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "testimonials";
    const paramsToSign = {
        timestamp,
        folder,
        resource_type: "video",
    };

    const signature = cloudinaryConfig.utils.api_sign_request(paramsToSign, process.env.CLOUD_SECRET);
    res.json({
        cloudName: process.env.CLOUD_NAME,
        apiKey: process.env.CLOUD_KEY,
        signature,
        timestamp,
        folder
    });
});
export const deleteSingleVideoFromCloudinary = async (public_id) => {
    try {
        const result = await cloudinaryConfig.uploader.destroy(public_id, {
            resource_type: "video"
        });
        if (result.result === "ok") {
            return true;
        }
        return false;
    } catch (error) {
        console.log("error:", error)
        throw error;
    }
}