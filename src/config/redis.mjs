import dotenv from "dotenv";
dotenv.config();
export const redisConnection = {
  url: process.env.REDIS_URL,
};
