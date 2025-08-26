import { QdrantVectorStore } from "@langchain/qdrant";
import { llm, isLLMAvailable } from "../../config/llm.js";
import { enqueuePdfJob } from "../../producers/pdf.producer.js";
import { embeddings, isEmbeddingsAvailable } from "../../config/embeddings.js";
import { registerPdfQueueEventHandlers } from "../../events/pdf.events.js";
import { env } from "../../config/env.js";
import logger from "../../utils/logger.js";
import type { Request, Response } from "express";

registerPdfQueueEventHandlers();

export class ChatController {
  public static instance: ChatController;

  static getInstance() {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  public uploadPdftoQueue = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const job = await enqueuePdfJob({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
      });

      logger.info(`PDF uploaded to queue: ${JSON.stringify(job)}`);
      return res.json({
        message: "File uploaded successfully",
        jobId: job.id,
        file: {
          originalname: req.file.originalname,
          size: req.file.size,
        },
      });
    } catch (err: any) {
      logger.error("Error uploading PDF to queue:", err);
      return res.status(500).json({ error: "Failed to upload PDF" });
    }
  };

  public uploadChatToVector = async (req: Request, res: Response) => {
    const { question } = req.body;

    try {
      // Check if LLM is available
      if (!isLLMAvailable()) {
        return res.status(503).json({
          error:
            "AI service is not available. Please configure GOOGLE_API_KEY in your environment variables.",
        });
      }

      // Check if embeddings are available
      if (!isEmbeddingsAvailable()) {
        return res.status(503).json({
          error:
            "Embeddings service is not available. Please configure GOOGLE_API_KEY in your environment variables.",
        });
      }

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings!,
        {
          url: env.QDRANT_URL,
          collectionName: env.QDRANT_COLLECTION,
        }
      );

      const ret = await vectorStore.asRetriever({ k: 2 });
      const result = await ret.invoke(question);
      const context = result.map((r: any) => r.pageContent).join("\n\n");

      logger.info(
        `Retrieved ${result.length} documents for question: ${question}`
      );

      const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided context. If the question is not related to the context, reply with "I'm sorry, I don't have enough information to answer that question."`;

      const aiMsg = await llm!.invoke([
        ["system", SYSTEM_PROMPT],
        ["human", `Context: ${context}\n\nQuestion: ${question}`],
      ]);

      // Normalize content to a plain string
      let answerText = "";

      if (typeof aiMsg === "string") {
        answerText = aiMsg;
      } else if (typeof aiMsg?.content === "string") {
        answerText = aiMsg.content;
      } else if (Array.isArray(aiMsg?.content)) {
        answerText = aiMsg.content
          .map((c: any) =>
            typeof c === "string" ? c : c?.text || c?.content || ""
          )
          .filter(Boolean)
          .join("\n");
      } else {
        answerText = JSON.stringify(aiMsg?.content || aiMsg || "", null, 2);
      }

      logger.info(`Generated answer for question: ${question}`);
      return res.json({ answer: answerText });
    } catch (error) {
      logger.error("Error in /chat:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

const ChatControllerService = ChatController.getInstance();

export default ChatControllerService;
