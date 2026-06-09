import { Embeddings } from "@langchain/core/embeddings";

export const HASH_EMBEDDING_DIMENSIONS = 384;

const STOP_WORDS = new Set([
  "and",
  "are",
  "for",
  "from",
  "the",
  "this",
  "that",
  "with",
  "when",
  "where",
  "your",
]);

export class HashEmbeddings extends Embeddings {
  readonly dimensions: number;

  constructor(dimensions = HASH_EMBEDDING_DIMENSIONS) {
    super({});
    this.dimensions = dimensions;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return documents.map((document) => this.embedText(document));
  }

  async embedQuery(document: string): Promise<number[]> {
    return this.embedText(document);
  }

  private embedText(text: string): number[] {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    const tokens = tokenize(text);
    const features = [...tokens, ...bigrams(tokens)];

    for (const feature of features) {
      const hash = fnv1a(feature);
      const index = hash % this.dimensions;
      const sign = hash % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }

    return normalize(vector);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function bigrams(tokens: string[]): string[] {
  const features: string[] = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    features.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  return features;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
