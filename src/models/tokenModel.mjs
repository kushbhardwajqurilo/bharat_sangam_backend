import mongoose from "mongoose";
const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7,
  },
});
const tokenModel = mongoose.model("token", tokenSchema);
export default tokenModel;
