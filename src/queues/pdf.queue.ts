// src/queues/pdf.queue.ts
import { Queue } from "bullmq";
import type { PdfJobData, PdfJobResult } from "../jobs/pdf.types.js";
import { queueOptions } from "../config/redis.js";

export const PDF_QUEUE_NAME = "pdf-queue";

export const pdfQueue = new Queue<PdfJobData, PdfJobResult>(
  PDF_QUEUE_NAME,
  queueOptions,
);
