// import dotenv from "dotenv";
// dotenv.config();
// import app from "./app.mjs";
// import connectDB from "./src/config/databse.mjs";
// // import { sendTestEmail } from "./src/config/bravoConfig.mjs";
// // sendTestEmail();
// const PORT = process.env.PORT || 8001;

// const startServer = async () => {
//   try {
//     await connectDB(); // connect DB first

//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 Server Running at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("❌ Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// startServer();

import dotenv from "dotenv";
dotenv.config();

import app from "./app.mjs";
import connectDB from "./src/config/databse.mjs";
import mongoose from "mongoose";

const PORT = process.env.PORT || 8001;

let server;

const startServer = async () => {
  try {
    await connectDB(); // ✅ connect DB first

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server Running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// 🔥 Graceful Shutdown (VERY IMPORTANT)
const shutdown = async (signal) => {
  console.log(`\n⚠️ ${signal} received. Closing server...`);

  try {
    if (server) {
      server.close(() => {
        console.log("🛑 HTTP server closed");
      });
    }

    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

// Handle signals
process.on("SIGINT", shutdown); // Ctrl + C
process.on("SIGTERM", shutdown); // PM2 / VPS stop
process.on("SIGQUIT", shutdown); // system quit
