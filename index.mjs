import dotenv from "dotenv";
dotenv.config();
import app from "./app.mjs";
import connectDB from "./src/config/databse.mjs";
// import { sendTestEmail } from "./src/config/bravoConfig.mjs";
// sendTestEmail();
const PORT = process.env.PORT || 8001;

const startServer = async () => {
  try {
    await connectDB(); // connect DB first

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server Running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
