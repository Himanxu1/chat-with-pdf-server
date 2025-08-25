// src/workers/pdf.worker.ts
import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import type { PdfJobData, PdfJobResult } from "../jobs/pdf.types.js";
import { PDF_QUEUE_NAME } from "../queues/pdf.queue.js";
import { workerOptions } from "../config/redis.js";
import { embeddings } from "../config/embeddings.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";



export const pdfWorker = new Worker<PdfJobData, PdfJobResult>(
  PDF_QUEUE_NAME,
  async (job) => {
    try {
      // job.data is already an object — no need to JSON.parse
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
        embeddings,
        {
          url: env.QDRANT_URL,
          collectionName: env.QDRANT_COLLECTION,
        },
      );

      await vectorStore.addDocuments(splitDocs);

      // Optional: report progress
      await job.updateProgress(100);

      logger.info(`Successfully processed PDF: ${data.filename}`);
      return { chunks: splitDocs.length, collection: env.QDRANT_COLLECTION };
    } catch (error) {
      logger.error(`Failed to process PDF: ${error}`);
      throw error;
    }
  },
  workerOptions,
);

// Basic lifecycle logging
pdfWorker.on("completed", (job, result) => {
  logger.info(`[worker] ${job.id} completed`, result);
});

pdfWorker.on("failed", (job, err) => {
  logger.error(`[worker] ${job?.id} failed:`, err?.message, err);
});
