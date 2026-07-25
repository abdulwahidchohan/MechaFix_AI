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
  matchType?: "Strong Match" | "Relevant Match" | "Related Source";
}

export interface RetrievalResult {
  contextText: string;
  sources: RetrievedSource[];
}
