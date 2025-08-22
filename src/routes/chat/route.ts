import { Router } from "express";
import { enqueuePdfJob } from "../../producers/pdf.producer.js";
import { upload } from "../../config/storage.js";
import { registerPdfQueueEventHandlers } from "../../events/pdf.events.js";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { llm } from "../../config/llm.js";
import ChatControllerService from "./chat.controller.js";
const router = Router();

registerPdfQueueEventHandlers();

router.post(
  "/pdf/upload",
  upload.single("pdf"),
  ChatControllerService.uploadChatToVector,
);

router.post("/chat", ChatControllerService.uploadPdftoQueue);

export default router;
