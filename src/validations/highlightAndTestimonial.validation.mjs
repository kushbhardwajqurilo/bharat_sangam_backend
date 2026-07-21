import mongoose from "mongoose";
import z from "zod";

export const highlightsSchema = z.object({
    event: z.string().refine(mongoose.Types.ObjectId.isValid, "Invalid Event Id"),
    url: z.string().url("Invalid URL"),
    public_id: z.string().trim()
})
