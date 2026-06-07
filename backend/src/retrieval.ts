import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { AgronomyGuidance } from "../../common/index.ts";
import { isHealthy } from "../../common/diseases.ts";

type MetadataValue = string | string[];

export type KnowledgeDocument = {
  metadata: Record<string, MetadataValue>;
  body: string;
  sections: Record<string, string>;
};

type MatchResult = {
  document: KnowledgeDocument;
  score: number;
  cropScore: number;
  diseaseScore: number;
};

const REQUIRED_METADATA = ["title", "crop", "disease", "source_name", "source_url"];
const GENERIC_DISEASE_TOKENS = new Set(["disease", "leaf", "leaves", "spot", "spots"]);

export function loadKnowledgeBase(directory: string): KnowledgeDocument[] {
  return readdirSync(directory)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => parseKnowledgeDocument(readFileSync(join(directory, filename), "utf-8")))
    .filter((document) =>
      REQUIRED_METADATA.every((field) => typeof document.metadata[field] === "string"),
    );
}

export function retrieveAgronomyGuidance(
  label: string,
  documents: KnowledgeDocument[],
): AgronomyGuidance | null {
  if (isHealthy(label)) {
    return null;
  }

  const query = parseModelLabel(label);
  const matches = documents
    .map((document) => scoreDocument(query, document))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);

  const best = matches[0];
  if (!best || best.cropScore < 1 || best.diseaseScore < 2) {
    return null;
  }

  return toAgronomyGuidance(best.document);
}

export function parseKnowledgeDocument(markdown: string): KnowledgeDocument {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { metadata: {}, body: markdown.trim(), sections: extractSections(markdown) };
  }

  const metadata = parseFrontmatter(match[1]);
  const body = match[2].trim();

  return {
    metadata,
    body,
    sections: extractSections(body),
  };
}

function parseFrontmatter(frontmatter: string): Record<string, MetadataValue> {
  const metadata: Record<string, MetadataValue> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    metadata[key] = parseMetadataValue(rawValue);
  }

  return metadata;
}

function parseMetadataValue(value: string): MetadataValue {
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}

function extractSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split(/\r?\n/);
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentHeading) {
        sections[currentHeading] = currentBody.join("\n").trim();
      }
      currentHeading = line.slice(3).trim();
      currentBody = [];
      continue;
    }

    currentBody.push(line);
  }

  if (currentHeading) {
    sections[currentHeading] = currentBody.join("\n").trim();
  }

  return sections;
}

function parseModelLabel(label: string) {
  const [cropPart = "", diseasePart = ""] = label.split("___");
  const cropTokens = tokenize(cropPart);
  const diseaseTokens = tokenize(diseasePart).filter(
    (token) => token !== "healthy" && !GENERIC_DISEASE_TOKENS.has(token),
  );

  return {
    cropTokens,
    diseaseTokens,
  };
}

function scoreDocument(
  query: ReturnType<typeof parseModelLabel>,
  document: KnowledgeDocument,
): MatchResult {
  const cropText = metadataText(document.metadata.crop);
  const diseaseText = metadataText(document.metadata.disease);
  const tagText = metadataText(document.metadata.retrieval_tags);
  const titleText = metadataText(document.metadata.title);

  const cropScore = query.cropTokens.reduce(
    (score, token) => score + countToken(token, `${cropText} ${tagText}`),
    0,
  );
  const diseaseScore = query.diseaseTokens.reduce(
    (score, token) => score + countToken(token, `${diseaseText} ${tagText} ${titleText}`),
    0,
  );

  return {
    document,
    score: cropScore * 3 + diseaseScore * 5,
    cropScore,
    diseaseScore,
  };
}

function countToken(token: string, text: string): number {
  const tokens = tokenize(text);
  return tokens.filter((candidate) => candidate === token).length;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function metadataText(value: MetadataValue | undefined): string {
  if (Array.isArray(value)) {
    return value.join(" ");
  }

  return value ?? "";
}

function toAgronomyGuidance(document: KnowledgeDocument): AgronomyGuidance {
  const guidance = extractBullets(document.sections["Farmer-Safe Guidance"]);
  const sourceUrl = metadataText(document.metadata.source_url);

  return {
    title: metadataText(document.metadata.title),
    crop: metadataText(document.metadata.crop),
    disease: metadataText(document.metadata.disease),
    sourceName: metadataText(document.metadata.source_name),
    sourceUrl,
    guidance,
    prevention: oneLine(document.sections.Prevention),
    escalation: oneLine(document.sections.Escalation),
  };
}

function extractBullets(section = ""): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function oneLine(section = ""): string | undefined {
  const value = section.replace(/\s+/g, " ").trim();
  return value || undefined;
}
