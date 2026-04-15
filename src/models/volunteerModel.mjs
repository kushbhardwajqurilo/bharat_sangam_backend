import mongoose from "mongoose";
const volunteerSchema = new mongoose.Schema(
  {
    // event: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: [true, "event required"],
    //   ref: "event",
    // },
    name: { type: String, required: [true, "Volunteer name required"] },
    email: {
      type: String,
      required: [true, "Volunteer email required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true],
    },
    active: { type: Boolean, default: false },
  },
  { timestamps: true },
);
volunteerSchema.index({ email: 1 });
const volunteerModel = mongoose.model("volunteer", volunteerSchema);
export default volunteerModel;
