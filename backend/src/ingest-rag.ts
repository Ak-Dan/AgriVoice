import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { getRagConfig, ingestKnowledgeBase } from "./langchainRag.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KNOWLEDGE_PATH = resolve(__dirname, "../../knowledge/disease_guides");

const config = {
  ...getRagConfig(),
  knowledgePath: KNOWLEDGE_PATH,
};

try {
  const summary = await ingestKnowledgeBase(config);
  console.log(
    `Indexed ${summary.sourceDocuments} source guides into ${summary.chunks} Chroma chunks`,
  );
  console.log(`Collection: ${summary.collectionName}`);
  console.log(`Chroma URL: ${summary.chromaUrl}`);
} catch (error) {
  console.error("Failed to ingest AgriVoice RAG corpus into Chroma.");
  console.error(error);
  process.exitCode = 1;
}
