import type { PdfJobData } from "../jobs/pdf.types.js";
import { pdfQueue } from "../queues/pdf.queue.js";

export async function enqueuePdfJob(data: PdfJobData) {
  const jobId = `pdf:${data.path}`;
  return pdfQueue.add("file", data, {
    jobId,
  });
}
