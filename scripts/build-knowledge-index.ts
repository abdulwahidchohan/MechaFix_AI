import fs from "fs";
import path from "path";

function buildKnowledgeIndex() {
  const knowledgeDir = path.join(process.cwd(), "knowledge");
  if (!fs.existsSync(knowledgeDir)) {
    console.log("Knowledge directory missing.");
    return;
  }

  const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith(".md"));
  const index = files.map((file) => {
    const content = fs.readFileSync(path.join(knowledgeDir, file), "utf-8");
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return {
      id: file.replace(/\.md$/, ""),
      title: titleMatch ? titleMatch[1].trim() : file,
      filename: file,
      lengthBytes: content.length,
    };
  });

  const outputPath = path.join(process.cwd(), "knowledge", "index.json");
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Knowledge base indexed ${index.length} documents into index.json`);
}

buildKnowledgeIndex();
