import { llm, isLLMAvailable } from "../../config/llm.js";
import { enqueuePdfJob } from "../../producers/pdf.producer.js";
import { isEmbeddingsAvailable } from "../../config/embeddings.js";
import { registerPdfQueueEventHandlers } from "../../events/pdf.events.js";
import logger from "../../utils/logger.js";
import type { Request, Response } from "express";
import { Chat } from "../../typeorm/entities/chat.js";
import { dataSource } from "../../typeorm/config/datasource.js";
import { Message } from "../../typeorm/entities/message.js";
import { enhancedRetrieverService } from "../../services/enhancedRetriever.js";

registerPdfQueueEventHandlers();

export class ChatController {
  public static instance: ChatController;

  static getInstance() {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  public createChat = async (req: Request, res: Response) => {
    const { userId, pdfId } = req.body;

    try {
      const chatRepository = dataSource.getRepository(Chat);
      const newChat = chatRepository.create({
        userId,
        pdfId: pdfId || null,
        threadId: `thread_${Date.now()}`,
      });
      await chatRepository.save(newChat);

      logger.info(`New chat created: ${JSON.stringify(newChat)}`);
      return res.status(201).json(newChat);
    } catch (error) {
      logger.error("Error creating new chat:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  public getChatsByUserId = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      const chatRepository = dataSource.getRepository(Chat);
      const chats = await chatRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      return res.json(chats);
    } catch (error) {
      logger.error(`Error fetching chats for user ${userId}:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  public getMessagesByChatId = async (req: Request, res: Response) => {
    const { chatId } = req.params;

    try {
      const messageRepository = dataSource.getRepository(Message);
      const messages = await messageRepository.find({
        where: { chatId },
        order: { createdAt: "ASC" },
      });
      return res.json(messages);
    } catch (error) {
      logger.error(`Error fetching messages for chat ${chatId}:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  public uploadPdftoQueue = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { chatId } = req.body;
      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      const job = await enqueuePdfJob({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
        chatId: chatId, // Pass chatId to the job data
      });

      // Update the chat with the pdfId after successful enqueue
      const chatRepository = dataSource.getRepository(Chat);
      const chat = await chatRepository.findOneBy({ id: chatId });
      if (chat) {
        chat.pdfId = `pdf_${job.id}`; // Use jobId as pdfId
        await chatRepository.save(chat);
      }

      logger.info(
        `PDF uploaded to queue for chat ${chatId}: ${JSON.stringify(job)}`
      );
      return res.json({
        message: "File uploaded successfully",
        jobId: job.id,
        file: {
          originalname: req.file.originalname,
          size: req.file.size,
        },
        chatId: chatId,
      });
    } catch (err: any) {
      logger.error("Error uploading PDF to queue:", err);
      return res.status(500).json({ error: "Failed to upload PDF" });
    }
  };

  public uploadChatToVector = async (req: Request, res: Response) => {
    const { question, chatId } = req.body;

    try {
      if (!isLLMAvailable()) {
        return res.status(503).json({
          error:
            "AI service is not available. Please configure GOOGLE_API_KEY in your environment variables.",
        });
      }

      if (!isEmbeddingsAvailable()) {
        return res.status(503).json({
          error:
            "Embeddings service is not available. Please configure GOOGLE_API_KEY in your environment variables.",
        });
      }

      // Retrieve the chat to get the associated pdfId
      const chatRepository = dataSource.getRepository(Chat);
      const chat = await chatRepository.findOneBy({ id: chatId });

      logger.info(`${JSON.stringify(chat)}-----chat`);

      if (!chat || !chat.pdfId) {
        return res
          .status(400)
          .json({ error: "Chat not found or no PDF associated" });
      }

      const messageRepository = dataSource.getRepository(Message);

      // Save user's message
      const userMessage = messageRepository.create({
        chatId: chat.id.toString(),
        content: question,
        role: "user",
      });
      await messageRepository.save(userMessage);

      // Use enhanced retrieval with query rewriting
      const retrievalResult = await enhancedRetrieverService.retrieveDocuments({
        pdfId: chat.pdfId,
        originalQuery: question,
        maxResults: 5,
        minScore: 0.6,
        useQueryRewriting: true,
        useHybridSearch: true
      });

      const context = retrievalResult.results.map((r: any) => r.content).join("\n\n");

      logger.info(
        `Enhanced retrieval: Retrieved ${retrievalResult.results.length} documents for question: "${question}" using ${retrievalResult.retrievalStrategy} strategy`
      );
      logger.info(`Query analysis: ${JSON.stringify(retrievalResult.queryAnalysis)}`);

      // Enhanced system prompt using query analysis
      const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided context. 

Query Analysis:
- Original Query: "${retrievalResult.queryAnalysis.originalQuery}"
- Rewritten Query: "${retrievalResult.queryAnalysis.rewrittenQuery}"
- Intent: ${retrievalResult.queryAnalysis.intent}
- Key Keywords: ${retrievalResult.queryAnalysis.keywords.join(', ')}

Instructions:
1. Answer based on the provided context
2. If the question is not related to the context, reply with "I'm sorry, I don't have enough information to answer that question."
3. Use the query analysis to better understand what the user is asking
4. Provide clear, accurate, and helpful responses
5. If multiple relevant pieces of information are found, synthesize them coherently`;

      const aiMsg = await llm!.invoke([
        ["system", SYSTEM_PROMPT],
        ["human", `Context: ${context}\n\nQuestion: ${question}`],
      ]);

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

      // Save AI's message
      const assistantMessage = messageRepository.create({
        chatId: chat.id.toString(),
        content: answerText,
        role: "assistant",
      });
      await messageRepository.save(assistantMessage);

      logger.info(
        `Generated answer for question: ${question} in chat ${chatId}`
      );
      return res.json({ answer: answerText });
    } catch (error) {
      logger.error("Error in /chat:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

const ChatControllerService = ChatController.getInstance();

export default ChatControllerService;
