import mongoose from "mongoose";
const adminSchema = new mongoose.Schema({
  name: { type: String, required: [true, "admin name required"] },
  phone: {
    type: Number,
    required: [true, "phone number required"],
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "email required"],
  },
  password: { type: String, required: [true, "password required"] },
});

const adminModel = mongoose.model("admin", adminSchema);
export default adminModel;
