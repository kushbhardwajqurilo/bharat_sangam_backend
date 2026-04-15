import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.mjs";

export const ticketQueue = new Queue("ticketQueue", {
  connection: redisConnection,
});
