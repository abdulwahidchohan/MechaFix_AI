import { retrieveTfidfContext } from "./tfidf";
import { retrieveEmbeddingContext } from "./embeddings";
import { RetrievalResult } from "./types";

export async function retrieveContext(
  queryText: string,
  topK = 3
): Promise<RetrievalResult> {
  const ragMode = process.env.RAG_MODE || "tfidf";

  if (ragMode === "embedding") {
    return await retrieveEmbeddingContext(queryText, topK);
  }

  return retrieveTfidfContext(queryText, topK);
}
