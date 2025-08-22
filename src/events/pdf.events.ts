// src/events/pdf.events.ts
import { QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { PDF_QUEUE_NAME } from "../queues/pdf.queue.js";

export const pdfQueueEvents = new QueueEvents(PDF_QUEUE_NAME, {
  connection: redisConnection,
});

export function registerPdfQueueEventHandlers() {
  pdfQueueEvents.on("completed", ({ jobId }, result) => {
    console.log(`[events] job ${jobId} completed`, result);
  });

  pdfQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[events] job ${jobId} failed: ${failedReason}`);
  });

  pdfQueueEvents.on("progress", ({ jobId, data }) => {
    console.log(`[events] job ${jobId} progress:`, data);
  });

  pdfQueueEvents.on("stalled", ({ jobId }) => {
    console.warn(`[events] job ${jobId} stalled`);
  });
}
