import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "../../../config/embeddings.js";

export async function buildVectorStoreFromDocs(
  docs: { url: string; title: string; text: string }[],
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,
    chunkOverlap: 200,
  });

  const allDocs = [];
  for (const d of docs) {
    const chunks = await splitter.splitText(d.text);
    for (const chunk of chunks) {
      allDocs.push({
        pageContent: chunk,
        metadata: { source: d.url, title: d.title },
      });
    }
  }

  const store = await MemoryVectorStore.fromDocuments(allDocs, embeddings);
  return store;
}
