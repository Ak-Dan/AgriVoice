// Single source of truth for turning a raw 38-class model label
// (e.g. "Tomato___Early_blight" or "Corn_(maize)___Common_rust_")
// into the i18n key used across the UI.
//
// The four maize labels map to the SHORT keys that already have polished
// English + Swahili content (rust / cercospora / blight / healthy).
// Every other label maps to itself; those keys are added English-only to
// the i18n resources and fall back to English automatically under SW.

export const MAIZE_LABEL_TO_KEY: Record<string, string> = {
  'Corn_(maize)___Common_rust_': 'rust',
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 'cercospora',
  'Corn_(maize)___Northern_Leaf_Blight': 'blight',
  'Corn_(maize)___healthy': 'healthy',
};

// Labels we have full content + sample/video support for.
export const MAIZE_LABELS = Object.keys(MAIZE_LABEL_TO_KEY);

export function labelToKey(label: string): string {
  return MAIZE_LABEL_TO_KEY[label] ?? label;
}

export function isMaizeLabel(label: string): boolean {
  return label in MAIZE_LABEL_TO_KEY;
}

// A label is "healthy" if it's the maize healthy key OR any 38-class
// label ending in "healthy" (e.g. Tomato___healthy).
export function isHealthyLabel(label: string): boolean {
  return label.toLowerCase().endsWith('healthy');
}