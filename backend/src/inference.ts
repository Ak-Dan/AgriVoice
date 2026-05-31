import { readFileSync } from "fs";
import type { Severity } from "../../common/index.ts";

export const NORMALIZATION_MEAN = [0.485, 0.456, 0.406] as const;
export const NORMALIZATION_STD = [0.229, 0.224, 0.225] as const;

export function loadClassLabels(labelsPath: string): string[] {
  return JSON.parse(readFileSync(labelsPath, "utf-8")) as string[];
}

export function softmax(scores: number[]) {
  const maxScore = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - maxScore));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

export function getSeverity(disease: string, confidence: number): Severity {
  if (disease.toLowerCase().endsWith("healthy")) {
    return "low";
  }

  if (confidence >= 0.9) {
    return "high";
  }

  if (confidence >= 0.75) {
    return "medium";
  }

  return "low";
}

export function decodePrediction(output: ArrayLike<number>, classDiseases: string[]) {
  const scores = Array.from(output, Number);
  const probabilities = softmax(scores);

  let topIndex = 0;
  for (let index = 1; index < probabilities.length; index += 1) {
    if (probabilities[index] > probabilities[topIndex]) {
      topIndex = index;
    }
  }

  const disease = classDiseases[topIndex] ?? "unknown";
  const confidence = probabilities[topIndex] ?? 0;

  return {
    disease,
    confidence,
    severity: getSeverity(disease, confidence),
  };
}
