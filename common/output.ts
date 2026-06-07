// The model now returns one of 38 PlantVillage label strings (see diseases.ts / labels.json),
// so `output` is the raw label string rather than a small fixed union.

export type Severity = "low" | "medium" | "high";

export type AgronomyGuidance = {
  title: string;
  crop: string;
  disease: string;
  sourceName: string;
  sourceUrl: string;
  guidance: string[];
  prevention?: string;
  escalation?: string;
};

export type Inference = {
  output: string;
  confidence: number;
  severity: Severity;
  agronomy?: AgronomyGuidance | null;
};
