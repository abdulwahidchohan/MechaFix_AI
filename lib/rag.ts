import fs from "fs";
import path from "path";

export interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  content: string;
  excerpt: string;
}

export interface RetrievedSource {
  title: string;
  filename: string;
  excerpt: string;
  relevanceScore: number;
}

let cachedDocuments: KnowledgeDocument[] | null = null;

function loadKnowledgeBase(): KnowledgeDocument[] {
  if (cachedDocuments) return cachedDocuments;

  const knowledgeDir = path.join(process.cwd(), "knowledge");
  if (!fs.existsSync(knowledgeDir)) {
    return [];
  }

  const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith(".md"));
  const docs: KnowledgeDocument[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      // Extract title from first # heading or filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, "");
      
      // First 250 characters as excerpt
      const cleanContent = content.replace(/^#+\s+.*$/gm, "").trim();
      const excerpt = cleanContent.slice(0, 220).replace(/\s+/g, " ") + "...";

      docs.push({
        id: file.replace(/\.md$/, ""),
        title,
        filename: file,
        content,
        excerpt,
      });
    } catch (err) {
      console.warn(`Error reading knowledge file ${file}:`, err);
    }
  }

  cachedDocuments = docs;
  return docs;
}

/**
 * Perform keyword & semantic scoring to retrieve top matching knowledge sources for Gemini RAG
 */
export function retrieveContext(
  queryText: string,
  topK = 3
): { contextText: string; sources: RetrievedSource[] } {
  const docs = loadKnowledgeBase();
  if (!docs.length || !queryText.trim()) {
    return { contextText: "", sources: [] };
  }

  const terms = queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scoredDocs = docs.map((doc) => {
    const docTextLower = (doc.title + " " + doc.content).toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (docTextLower.includes(term)) {
        // Higher weight for matches in title or specific technical terms
        if (doc.title.toLowerCase().includes(term)) {
          score += 3;
        } else {
          score += 1;
        }
      }
    }

    return {
      doc,
      score,
    };
  });

  // Filter out non-matching docs and sort descending
  const matches = scoredDocs
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (!matches.length) {
    return { contextText: "", sources: [] };
  }

  const sources: RetrievedSource[] = matches.map((m) => ({
    title: m.doc.title,
    filename: m.doc.filename,
    excerpt: m.doc.excerpt,
    relevanceScore: Math.min(100, m.score * 20),
  }));

  const contextText = matches
    .map((m) => `--- DOCUMENT: ${m.doc.title} (${m.doc.filename}) ---\n${m.doc.content}`)
    .join("\n\n");

  return { contextText, sources };
}
