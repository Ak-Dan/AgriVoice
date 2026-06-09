import { describe, expect, it } from "vitest";
import { HASH_EMBEDDING_DIMENSIONS, HashEmbeddings } from "./hashEmbeddings.ts";

describe("HashEmbeddings", () => {
  it("returns deterministic normalized vectors", async () => {
    const embeddings = new HashEmbeddings();
    const first = await embeddings.embedQuery("maize common rust guidance");
    const second = await embeddings.embedQuery("maize common rust guidance");

    expect(first).toHaveLength(HASH_EMBEDDING_DIMENSIONS);
    expect(second).toEqual(first);
    expect(vectorMagnitude(first)).toBeCloseTo(1, 5);
  });

  it("embeds batches with the configured dimensions", async () => {
    const embeddings = new HashEmbeddings(32);
    const vectors = await embeddings.embedDocuments(["potato late blight", "cassava mosaic"]);

    expect(vectors).toHaveLength(2);
    expect(vectors[0]).toHaveLength(32);
    expect(vectors[1]).toHaveLength(32);
  });
});

function vectorMagnitude(vector: number[]): number {
  return Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
}
