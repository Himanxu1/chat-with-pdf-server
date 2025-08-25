import { fetchAndExtract } from "../../utils/fetchDataFromUrl.js";
import { buildVectorStoreFromDocs } from "./utils/buildVectorStoreFromDocs.js";
import { vectorRetriever } from "./utils/retriever.js";
import { buildGraph, GraphState } from "./utils/graph.js";
import logger from "../../utils/logger.js";
import type { Request, Response } from "express";

type Session = {
  store: any;
  graph: any;
  createdAt: number;
};

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const sessions = new Map<string, Session>();

// Cleanup expired sessions
setInterval(
  () => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [sessionId, session] of sessions.entries()) {
      if (now - session.createdAt > SESSION_TTL) {
        sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }
  },
  5 * 60 * 1000,
); // Clean every 5 minutes

class WebsiteChatController {
  public static instance: WebsiteChatController;

  static getInstance() {
    if (!WebsiteChatController.instance) {
      WebsiteChatController.instance = new WebsiteChatController();
    }
    return WebsiteChatController.instance;
  }

  public uploadWebsiteLink = async (req: Request, res: Response) => {
    try {
      const { url, sessionId } = req.body;

      logger.info(`Processing website: ${url} for session: ${sessionId}`);

      const doc = await fetchAndExtract(url);
      const store = await buildVectorStoreFromDocs([doc]);

      const retriever: any = vectorRetriever(store);
      const graph = buildGraph(retriever);

      sessions.set(sessionId, {
        store,
        graph,
        createdAt: Date.now(),
      });

      logger.info(`Website processed successfully: ${doc.title}`);
      res.json({ ok: true, title: doc.title });
    } catch (e: any) {
      logger.error(`Error processing website: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  };

  public chatWithWebsite = async (req: Request, res: Response) => {
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res
        .status(400)
        .json({ error: "Session expired or not found. Please reinitialize." });
    }

    try {
      const result = await session.graph.invoke({
        question: message,
        context: [],
        answer: "",
        citations: [],
      } as typeof GraphState.State);

      logger.info(`Chat response generated for session: ${sessionId}`);
      return res.json({ answer: result.answer, citations: result.citations });
    } catch (error: any) {
      logger.error(`Error in chat: ${error.message}`);
      return res.status(500).json({ error: "Failed to generate response" });
    }
  };
}

const WebsiteChatControllerService = WebsiteChatController.getInstance();

export default WebsiteChatControllerService;
