import mongoose from "mongoose";
const calendarSchema = new mongoose.Schema({
  festival: { type: String, required: [true, "festival name required"] },
  date: { type: Date, required: [true, "date required"] },
  image: { type: String, default: "" },
  day: { type: String, required: true },
  month: { type: String, required: true },
});
const calendarModel = mongoose.model("calendar", calendarSchema);
export default calendarModel;
