import type { Inference, Disease } from '../../common/index.ts';
import type { DiagnosisResponse, DiseaseKey } from './types';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

const DISEASE_MAP: Record<Disease, DiseaseKey> = {
  healthy: 'healthy',
  greyLeaf: 'cercospora',
  rust: 'rust',
  blight: 'blight',
};

export async function diagnoseLeaf(imageFile: File): Promise<DiagnosisResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_URL}/infer`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => null) as { error?: string } | null;

    return {
      diagnosis: null,
      error: errorPayload?.error ?? `API error: ${response.status}`,
    };
  }

  const data = (await response.json()) as Inference;
  const disease = DISEASE_MAP[data.output] ?? 'healthy';

  return {
    diagnosis: {
      disease,
      confidence: data.confidence,
      severity: data.severity,
    },
    error: null,
  };
}
