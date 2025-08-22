import { QdrantVectorStore } from "@langchain/qdrant";
import { llm } from "../../config/llm.js";
import { enqueuePdfJob } from "../../producers/pdf.producer.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

export class ChatContoller {
  public static instance: ChatContoller;

  static getInstance() {
    if (!ChatContoller.instance) {
      ChatContoller.instance = new ChatContoller();
    }
    return ChatContoller.instance;
  }

  public uploadPdftoQueue = async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const job = await enqueuePdfJob({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
      });
      res.json({
        message: "File uploaded successfully",
        jobId: job.id,
        file: req.file,
      });
    } catch (err: any) {
      console.error("Error uploading PDF to queue:", err);
      return res.status(500).json({ error: "Failed to upload PDF" });
    }
  };

  public uploadChatToVector = async (req: any, res: any) => {
    const { question } = req.body;

    try {
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName: "langchainjs-testing",
        },
      );

      const ret = await vectorStore.asRetriever({ k: 2 });
      const result = await ret.invoke(question);
      const context = result.map((r: any) => r.pageContent).join("\n\n");

      console.log(result, "----result---");

      const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided context.If the question is not related to the context reply with sorry`;

      const aiMsg = await llm.invoke([
        ["system", SYSTEM_PROMPT],
        ["human", question],
        ["ai", context],
      ]);

      console.log(aiMsg.content, "---aimsg---");

      // Normalize content to a plain string
      let answerText = "";

      if (typeof aiMsg === "string") {
        answerText = aiMsg;
      } else if (typeof aiMsg?.content === "string") {
        answerText = aiMsg.content;
      } else if (Array.isArray(aiMsg?.content)) {
        answerText = aiMsg.content
          .map((c: any) =>
            typeof c === "string" ? c : c?.text || c?.content || "",
          )
          .filter(Boolean)
          .join("\n");
      } else {
        answerText = JSON.stringify(aiMsg?.content || aiMsg || "", null, 2);
      }

      console.log(answerText, "---aimsg---");
      return res.json({ answer: answerText });
    } catch (error) {
      console.error("Error in /chat:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

const ChatControllerService = ChatContoller.getInstance();

export default ChatControllerService;
