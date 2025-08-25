import { MemoryVectorStore } from "langchain/vectorstores/memory";

export function vectorRetriever(store: MemoryVectorStore, k = 6) {
  return async (q: string) => {
    const results = await store.similaritySearch(q, k);
    return results.map((r) => ({
      content: r.pageContent,
      source: r.metadata?.["source"] as string,
      title: r.metadata?.["title"] as string | undefined,
    }));
  };
}
