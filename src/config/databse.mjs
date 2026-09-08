import mongoose from "mongoose";

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("⚡ Already connected to MongoDB");
    return;
  }

  const dbUri = process.env.NODE_ENV === "production"
    ? process.env.DB_URI
    : (process.env.TEST_DB_URI || process.env.DB_URI);

  try {
    const conn = await mongoose.connect(dbUri, {
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
