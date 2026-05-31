// The model now returns one of 38 PlantVillage label strings (see diseases.ts / labels.json),
// so `output` is the raw label string rather than a small fixed union.

export type Severity = "low" | "medium" | "high";

export type Inference = {
  output: string;
  confidence: number;
  severity: Severity;
};