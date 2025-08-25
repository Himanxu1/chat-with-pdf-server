import { StateGraph, Annotation } from "@langchain/langgraph";
import { RunnableLambda } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

type RetrievalResult = { content: string; source: string; title?: string };

export const GraphState = Annotation.Root({
  question: Annotation<string>(),
  context: Annotation<RetrievalResult[]>(),
  answer: Annotation<string>(),
  citations: Annotation<{ source: string; title?: string }[]>(),
});

export function buildGraph(retriever: (q: any) => Promise<RetrievalResult[]>) {
  const retrieveNode = new RunnableLambda({
    func: async (state: typeof GraphState.State) => {
      const ctx = await retriever(state.question);
      return { ...state, context: ctx };
    },
  });

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.2,
  });

  const generateNode = new RunnableLambda({
    func: async (state: any) => {
      const contextText = state.context
        .map(
          (c: any, i: any) => `[#${i + 1}] ${c.content}\n(Source: ${c.source})`,
        )
        .join("\n\n");

      const prompt = [
        {
          role: "system",
          content:
            "You are a helpful assistant. Answer strictly using the provided context. Provide concise answers and include inline bracket citations like [#1], [#2] that refer to the provided chunks.",
        },
        {
          role: "user",
          content: `User question: ${state.question}\n\nContext:\n${contextText}`,
        },
      ];

      const res = await llm.invoke(prompt);
      const answer = (res as AIMessage).content?.toString?.() ?? "";
      const citations = state.context.map((c: any) => ({
        source: c.source,
        title: c.title,
      }));
      return { ...state, answer, citations };
    },
  });

  const graph = new StateGraph(GraphState)
    .addNode("retrieve", retrieveNode)
    .addNode("generate", generateNode)
    .addEdge("retrieve", "generate")
    .compile();

  return graph;
}
