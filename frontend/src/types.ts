export type DiseaseKey =
  | 'healthy'
  | 'cercospora'
  | 'rust'
  | 'blight';

export type SeverityKey = 'low' | 'medium' | 'high';

export interface Disease {
  key: DiseaseKey;
  name: string;
  description: string;
  videoUrl?: string;
}

export interface DiagnosisResult {
  disease: DiseaseKey;
  confidence: number;
  severity: SeverityKey;
}

export interface DiagnosisResponse {
  diagnosis: DiagnosisResult | null;
  error: string | null;
}

export interface HistoryEntry extends DiagnosisResult {
  timestamp: string;
  previewUrl?: string;
}
