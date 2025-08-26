import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "./env.js";

// Only create LLM instance if API key is available
export const llm = env.GOOGLE_API_KEY 
  ? new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      maxRetries: 2,
      apiKey: env.GOOGLE_API_KEY,
    })
  : null;

// Helper function to check if LLM is available
export const isLLMAvailable = (): boolean => {
  return llm !== null;
};
