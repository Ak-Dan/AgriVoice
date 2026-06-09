// `disease` now holds the i18n KEY (maize short-key like "rust", or the raw
// 38-class label for non-maize, e.g. "Tomato___Early_blight"). All UI text is
// resolved via t(`diseases.${disease}`) etc., with English fallback for non-maize.

export type SeverityKey = 'low' | 'medium' | 'high';

export interface AgronomyGuidance {
  title: string;
  crop: string;
  disease: string;
  sourceName: string;
  sourceUrl: string;
  guidance: string[];
  prevention?: string;
  escalation?: string;
}

export interface DiagnosisResult {
  disease: string;       // i18n key (see labels.ts -> labelToKey)
  rawLabel: string;      // original model label, kept for history/debugging
  healthy: boolean;      // true only for genuine *_healthy labels
  recognized: boolean;   // false if label is not one of the 38 known classes
  confidence: number;
  severity: SeverityKey;
  agronomy?: AgronomyGuidance | null;
}

export interface DiagnosisResponse {
  diagnosis: DiagnosisResult | null;
  error: string | null;
}

export interface HistoryEntry extends DiagnosisResult {
  timestamp: string;
  previewUrl?: string;
}
