import express from "express";
import multer from "multer";
import cors from "cors";
import { Queue } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// Removed multi-agent workflow orchestrator and UUID; keeping simple chat

const app = express();
app.use(cors());
app.use(express.json());

const myQueue = new Queue("pdf-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

// Multi-agent workflow removed; no orchestrator

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxRetries: 2,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});

app.get("/", (req, res) => {
  res.send("Welcome to the ChatPDF server!");
});

app.post("/pdf/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  myQueue.add(
    "file",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  res.json({ message: "File uploaded successfully", file: req.file });
});

// Removed multi-agent workflow endpoints

// Legacy chat endpoint (single agent)
app.post("/chat", async (req, res) => {
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
      }
    );

    const ret = await vectorStore.asRetriever({ k: 2 });
    const result = await ret.invoke(question);
    const context = result.map((r) => r.pageContent).join("\n\n");

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
        .map((c) => (typeof c === "string" ? c : c?.text || c?.content || ""))
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
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
