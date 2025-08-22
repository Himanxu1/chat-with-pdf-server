import type { QueueOptions, WorkerOptions } from "bullmq";

export const redisConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 24 * 60 * 60 },
    removeOnFail: { age: 7 * 24 * 60 * 60 },
  },
  prefix: process.env.BULL_PREFIX ?? "app",
};

export const workerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 4),
  limiter: {
    max: Number(process.env.WORKER_RPS_MAX ?? 10),
    duration: Number(process.env.WORKER_RPS_WINDOW_MS ?? 1000),
  },
};
