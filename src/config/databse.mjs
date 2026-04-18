import mongoose from "mongoose";

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("⚡ Already connected to MongoDB");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Connected`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

export default connectDB;
