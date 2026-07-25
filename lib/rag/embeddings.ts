import { getGeminiClient } from "../ai/client";
import { MODELS } from "../ai/models";
import { loadKnowledgeBase } from "./tfidf";
import { RetrievalResult, RetrievedSource } from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveEmbeddingContext(
  queryText: string,
  topK = 3
): Promise<RetrievalResult> {
  const docs = loadKnowledgeBase();
  if (!docs.length || !queryText.trim()) {
    return { contextText: "", sources: [] };
  }

  try {
    const client = getGeminiClient();
    const model = MODELS.embeddingModel;

    // Embed user query
    const queryEmbedRes: any = await client.models.embedContent({
      model,
      contents: queryText,
    });

    const queryVector: number[] | undefined =
      queryEmbedRes.embedding?.values || queryEmbedRes.embeddings?.[0]?.values;

    if (!queryVector) {
      throw new Error("No query vector returned");
    }

    // Embed documents
    const docScores = await Promise.all(
      docs.map(async (doc) => {
        try {
          const docEmbedRes: any = await client.models.embedContent({
            model,
            contents: `${doc.title}\n${doc.excerpt}`,
          });
          const docVector: number[] =
            docEmbedRes.embedding?.values || docEmbedRes.embeddings?.[0]?.values || [];
          const sim = cosineSimilarity(queryVector, docVector);
          return { doc, score: sim };
        } catch {
          return { doc, score: 0 };
        }
      })
    );

    const matches = docScores
      .filter((item) => item.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (!matches.length) {
      return { contextText: "", sources: [] };
    }

    const sources: RetrievedSource[] = matches.map((m) => {
      const rawScore = Math.round(m.score * 100);
      let matchType: "Strong Match" | "Relevant Match" | "Related Source" = "Related Source";
      if (rawScore >= 75) matchType = "Strong Match";
      else if (rawScore >= 50) matchType = "Relevant Match";

      return {
        title: m.doc.title,
        filename: m.doc.filename,
        excerpt: m.doc.excerpt,
        relevanceScore: rawScore,
        matchType,
      };
    });

    const contextText = matches
      .map((m) => `--- DOCUMENT: ${m.doc.title} (${m.doc.filename}) ---\n${m.doc.content}`)
      .join("\n\n");

    return { contextText, sources };
  } catch (err) {
    console.warn("Embedding retrieval error, falling back to TF-IDF:", err);
    const { retrieveTfidfContext } = await import("./tfidf");
    return retrieveTfidfContext(queryText, topK);
  }
}
