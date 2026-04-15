import mongoose from "mongoose";
const sponsorSchema = new mongoose.Schema({
  sponsorName: { type: String, required: [true, "sponsor name required"] },
  sponsorIcon: { type: String, required: [true, "sponsor icon required"] },
});

const sponsorModel = mongoose.model("sponsor", sponsorSchema);
export default sponsorModel;
