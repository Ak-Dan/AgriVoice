import type { Inference } from '../../common/index.ts';
import type { DiagnosisResponse, SeverityKey } from './types';
import { labelToKey, isHealthyLabel } from './labels.ts';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

// The 38 labels we recognise. Kept here so an unexpected label never silently
// becomes "healthy" — it surfaces as unrecognised instead.
const KNOWN_LABELS = new Set<string>([
  'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
  'Blueberry___healthy',
  'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
  'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
  'Grape___Black_rot', 'Grape___Esca_(Black_Measles)',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
  'Orange___Haunglongbing_(Citrus_greening)',
  'Peach___Bacterial_spot', 'Peach___healthy',
  'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy',
  'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
  'Raspberry___healthy', 'Soybean___healthy',
  'Squash___Powdery_mildew',
  'Strawberry___Leaf_scorch', 'Strawberry___healthy',
  'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
  'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy',
]);

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
  const rawLabel = data.output;
  const recognized = KNOWN_LABELS.has(rawLabel);

  // Unrecognised labels map to a dedicated "unknown" i18n key — never "healthy".
  const disease = recognized ? labelToKey(rawLabel) : 'unknown';

  return {
    diagnosis: {
      disease,
      rawLabel,
      recognized,
      healthy: recognized && isHealthyLabel(rawLabel),
      confidence: data.confidence,
      severity: data.severity as SeverityKey,
      agronomy: data.agronomy ?? null,
    },
    error: null,
  };
}
