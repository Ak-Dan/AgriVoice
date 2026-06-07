import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { ChromaClient } from "chromadb";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { AgronomyGuidance } from "../../common/index.ts";
import {
  type KnowledgeDocument,
  parseKnowledgeDocument,
  retrieveAgronomyGuidance,
} from "./retrieval.ts";
import { HashEmbeddings, HASH_EMBEDDING_DIMENSIONS } from "./hashEmbeddings.ts";

export const DEFAULT_CHROMA_URL = "http://localhost:8000";
export const DEFAULT_RAG_COLLECTION = "agrivoice_disease_guides";

export type RagConfig = {
  chromaUrl: string;
  collectionName: string;
  knowledgePath: string;
};

export type RagIngestSummary = {
  collectionName: string;
  chromaUrl: string;
  sourceDocuments: number;
  chunks: number;
};

export type LangChainRagRetriever = {
  retrieve(label: string): Promise<AgronomyGuidance | null>;
};

export function getRagConfig(env = process.env): Omit<RagConfig, "knowledgePath"> {
  return {
    chromaUrl: env.CHROMA_URL ?? DEFAULT_CHROMA_URL,
    collectionName: env.CHROMA_COLLECTION ?? DEFAULT_RAG_COLLECTION,
  };
}

export function shouldUseChroma(env = process.env): boolean {
  return env.RAG_BACKEND === "chroma" || Boolean(env.CHROMA_URL);
}

export async function ingestKnowledgeBase(config: RagConfig): Promise<RagIngestSummary> {
  const sourceDocuments = loadKnowledgeDocuments(config.knowledgePath);
  const chunks = await chunkKnowledgeDocuments(sourceDocuments);
  const client = new ChromaClient({ path: config.chromaUrl });

  try {
    await client.deleteCollection({ name: config.collectionName });
  } catch {
    // Collection may not exist yet; rebuilding should remain idempotent.
  }

  const vectorStore = new Chroma(new HashEmbeddings(), {
    collectionName: config.collectionName,
    url: config.chromaUrl,
    numDimensions: HASH_EMBEDDING_DIMENSIONS,
  });

  await vectorStore.addDocuments(chunks, {
    ids: chunks.map((document) => String(document.metadata.chunk_id)),
  });

  return {
    collectionName: config.collectionName,
    chromaUrl: config.chromaUrl,
    sourceDocuments: sourceDocuments.length,
    chunks: chunks.length,
  };
}

export async function createLangChainRagRetriever(
  config: RagConfig,
): Promise<LangChainRagRetriever> {
  const sourceDocuments = loadKnowledgeDocuments(config.knowledgePath);
  const documentsById = new Map(
    sourceDocuments.map((document) => [String(document.metadata.id), document]),
  );
  const vectorStore = await Chroma.fromExistingCollection(new HashEmbeddings(), {
    collectionName: config.collectionName,
    url: config.chromaUrl,
    numDimensions: HASH_EMBEDDING_DIMENSIONS,
  });

  await vectorStore.ensureCollection();

  return {
    async retrieve(label: string): Promise<AgronomyGuidance | null> {
      const query = modelLabelToRagQuery(label);
      const results = await vectorStore.similaritySearch(query, 6);
      const candidateDocuments = results
        .map((document) => documentsById.get(String(document.metadata.source_id)))
        .filter((document): document is KnowledgeDocument => Boolean(document));

      return retrieveAgronomyGuidance(label, candidateDocuments);
    },
  };
}

export function loadKnowledgeDocuments(directory: string): KnowledgeDocument[] {
  return readdirSync(directory)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => parseKnowledgeDocument(readFileSync(join(directory, filename), "utf-8")));
}

export async function chunkKnowledgeDocuments(
  documents: KnowledgeDocument[],
): Promise<Document[]> {
  const splitter = new MarkdownTextSplitter({
    chunkSize: 900,
    chunkOverlap: 120,
  });

  const chunks: Document[] = [];

  for (const document of documents) {
    const sourceId = String(document.metadata.id);
    const baseMetadata = normalizeMetadata(document);
    const splitDocuments = await splitter.createDocuments(
      [formatDocumentForRetrieval(document)],
      [baseMetadata],
    );

    splitDocuments.forEach((chunk, index) => {
      chunks.push(
        new Document({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            chunk_id: `${sourceId}:${index}`,
          },
        }),
      );
    });
  }

  return chunks;
}

export function modelLabelToRagQuery(label: string): string {
  const [rawCrop = "", rawDisease = ""] = label.split("___");
  const crop = rawCrop.replace(/[_(),]+/g, " ").trim();
  const disease = rawDisease.replace(/[_(),]+/g, " ").trim();
  return `${crop} ${disease} symptoms farmer safe guidance prevention escalation treatment`;
}

function formatDocumentForRetrieval(document: KnowledgeDocument): string {
  return [
    `Title: ${String(document.metadata.title ?? "")}`,
    `Crop: ${String(document.metadata.crop ?? "")}`,
    `Disease: ${String(document.metadata.disease ?? "")}`,
    `Tags: ${metadataValueToString(document.metadata.retrieval_tags)}`,
    "",
    document.body,
  ].join("\n");
}

function normalizeMetadata(document: KnowledgeDocument): Record<string, string> {
  return {
    source_id: String(document.metadata.id),
    title: String(document.metadata.title ?? ""),
    crop: String(document.metadata.crop ?? ""),
    disease: String(document.metadata.disease ?? ""),
    source_name: String(document.metadata.source_name ?? ""),
    source_url: String(document.metadata.source_url ?? ""),
    retrieval_tags: metadataValueToString(document.metadata.retrieval_tags),
  };
}

function metadataValueToString(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return typeof value === "string" ? value : "";
}
