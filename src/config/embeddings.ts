import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { env } from "./env.js";

// Only create embeddings instance if API key is available
export const embeddings = env.GOOGLE_API_KEY
  ? new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: "Document title",
      apiKey: env.GOOGLE_API_KEY,
    })
  : null;

export const isEmbeddingsAvailable = (): boolean => {
  return embeddings !== null;
};
