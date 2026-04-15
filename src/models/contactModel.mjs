import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "full name required"],
      trim: true,
    },
    email: { type: String, required: [true, "email required"], trim: true },
    phone: { type: String, required: [true, "phone required"], trim: true },
    query: { type: String, required: [true, "query required"] },
  },
  { timestamps: true },
);

//  Search indexes
contactSchema.index({ fullName: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ phone: 1 });

//  Latest first sorting
contactSchema.index({ createdAt: -1 });

// (Optional ) Combined search index (better for multi-field queries)
contactSchema.index({ fullName: 1, email: 1, phone: 1 });

const contactModel = mongoose.model("contact", contactSchema);
export default contactModel;
