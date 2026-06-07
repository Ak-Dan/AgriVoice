import { describe, expect, it } from "vitest";
import {
  chunkKnowledgeDocuments,
  getRagConfig,
  modelLabelToRagQuery,
  shouldUseChroma,
} from "./langchainRag.ts";
import { parseKnowledgeDocument } from "./retrieval.ts";

const guide = parseKnowledgeDocument(`---
id: maize_common_rust_kalro
title: Maize Common Rust
crop: maize
disease: common rust
source_name: KALRO repository
source_url: https://example.com/maize-rust
retrieval_tags: [maize, corn, common rust, Puccinia sorghi]
---

## Farmer-Safe Guidance

- Plant resistant varieties where available.
- Scout leaves for rust pustules.
- Ask an extension worker about local fungicide guidance.

## Prevention

Use resistant varieties and monitor fields regularly.
`);

describe("LangChain RAG helpers", () => {
  it("builds markdown chunks with Chroma-safe metadata", async () => {
    const chunks = await chunkKnowledgeDocuments([guide]);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.source_id).toBe("maize_common_rust_kalro");
    expect(chunks[0].metadata.crop).toBe("maize");
    expect(chunks[0].metadata.retrieval_tags).toContain("common rust");
    expect(chunks[0].pageContent).toContain("Maize Common Rust");
  });

  it("creates useful retrieval queries from PlantVillage labels", () => {
    const query = modelLabelToRagQuery("Corn_(maize)___Common_rust_");

    expect(query).toContain("Corn maize");
    expect(query).toContain("Common rust");
    expect(query).toContain("prevention");
  });

  it("enables Chroma only when configured", () => {
    expect(shouldUseChroma({})).toBe(false);
    expect(shouldUseChroma({ RAG_BACKEND: "chroma" })).toBe(true);
    expect(shouldUseChroma({ CHROMA_URL: "http://localhost:8000" })).toBe(true);
  });

  it("uses stable default Chroma config", () => {
    expect(getRagConfig({}).collectionName).toBe("agrivoice_disease_guides");
    expect(getRagConfig({}).chromaUrl).toBe("http://localhost:8000");
  });
});
