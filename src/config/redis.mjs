import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,

  retryStrategy(times) {
    console.log(`Retry attempt ${times}`);

    // reconnect delay
    return Math.min(times * 200, 5000);
  },

  reconnectOnError(err) {
    console.log("Reconnect Error:", err);
    return true;
  },

  enableReadyCheck: false,
  lazyConnect: true,
  keepAlive: 30000,
});

redisConnection.on("connect", () => {
  console.log("✅ Redis connected");
});

redisConnection.on("ready", () => {
  console.log("🚀 Redis ready");
});

redisConnection.on("error", (err) => {
  console.log("❌ Redis error:", err);
});

redisConnection.on("close", () => {
  console.log("⚠️ Redis closed");
});

redisConnection.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

export default redisConnection;
