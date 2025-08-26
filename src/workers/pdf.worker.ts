// src/workers/pdf.worker.ts
import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import type { PdfJobData, PdfJobResult } from "../jobs/pdf.types.js";
// import { PDF_QUEUE_NAME } from "../queues/pdf.queue.js";
import { workerOptions } from "../config/redis.js";
import { embeddings } from "../config/embeddings.js";
import logger from "../utils/logger.js";

export const pdfWorker = new Worker<PdfJobData, PdfJobResult>(
  "pdf-queue",
  async (job) => {
    try {
      logger.info(`${JSON.stringify(job.data)} - Starting PDF processing`);

      // // job.data is already an object — no need to JSON.parse
      const data = job.data;

      logger.info(`Processing PDF: ${data.filename}`);

      // 1) Load PDF
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();

      // 2) Split into chunks
      const textSplitter = new CharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await textSplitter.splitDocuments(docs);

      logger.info(`Split PDF into ${splitDocs.length} chunks`);

      // 3) Vector store (Qdrant)
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings!,
        {
          url: "http://localhost:6333",
          collectionName: "langchainjs-testing",
        }
      );
      logger.info(`${JSON.stringify(vectorStore)}---- vectorStore`);

      await vectorStore.addDocuments(splitDocs);

      // Optional: report progress
      await job.updateProgress(100);

      // logger.info(`Successfully processed PDF: ${data.filename}`);
      return { chunks: 0, collection: "langchainjs-testing" };
    } catch (error) {
      logger.error(`Failed to process PDF: ${error}`);
      throw error;
    }
  },
  workerOptions
);

// Basic lifecycle logging
pdfWorker.on("completed", (job, result) => {
  logger.info(`[worker] ${job.id} completed`, result);
});

pdfWorker.on("failed", (job, err) => {
  logger.error(`[worker] ${job?.id} failed:`, err?.message, err);
});

pdfWorker.on("error", (err) => {
  logger.error("[worker] error:", err);
});

pdfWorker.on("ready", () => {
  logger.info("[worker] ready");
});
pdfWorker.on("stalled", (job: any) => {
  logger.warn(`[worker] ${job.id} stalled`);
});
pdfWorker.on("progress", (job, progress) => {
  logger.info(`[worker] ${job.id} progress: ${progress}`);
});
