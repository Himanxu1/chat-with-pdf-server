// src/workers/pdf.worker.ts
import { Worker, type JobsOptions } from "bullmq";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import type { PdfJobData, PdfJobResult } from "../jobs/pdf.types.js";
import { PDF_QUEUE_NAME } from "../queues/pdf.queue.js";
import { workerOptions } from "../config/redis.js";

// Optional per-job overrides if needed
const processorJobOpts: JobsOptions = {
  // e.g., override attempts/backoff for this processor type if needed
};

export const pdfWorker = new Worker<PdfJobData, PdfJobResult>(
  PDF_QUEUE_NAME,
  async (job) => {
    // job.data is already an object — no need to JSON.parse
    const data = job.data;

    // 1) Load PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    // 2) Split into chunks
    const textSplitter = new CharacterTextSplitter({
      chunkSize: 100,
      chunkOverlap: 0,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // 3) Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: data.filename ?? "Document",
    });

    // 4) Vector store (Qdrant)
    const collectionName =
      process.env.QDRANT_COLLECTION ?? "langchainjs-testing";
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL ?? "http://localhost:6333",
        collectionName,
        // apiKey: process.env.QDRANT_API_KEY, // if secured
      },
    );

    await vectorStore.addDocuments(splitDocs);

    // Optional: report progress
    await job.updateProgress(100);

    return { chunks: splitDocs.length, collection: collectionName };
  },
  workerOptions,
);

// Basic lifecycle logging
pdfWorker.on("completed", (job, result) => {
  console.log(`[worker] ${job.id} completed`, result);
});

pdfWorker.on("failed", (job, err) => {
  console.error(`[worker] ${job?.id} failed:`, err?.message, err);
});
