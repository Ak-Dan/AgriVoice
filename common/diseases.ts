// Disease metadata keyed by the EXACT label strings the model outputs
// (these match labels.json, written by convert_to_onnx.py from the training class list).
//
// `name`      - human-friendly display name
// `crop`      - the crop the label belongs to (handy for UI grouping/filtering)
// `treatment` - PLACEHOLDER. Fill these from your authoritative agronomy source
//               (the PDF referenced in the original TODO). Do NOT ship invented
//               treatment advice — wrong guidance on a real crop can cause harm.

export type DiseaseInfo = {
  name: string;
  crop: string;
  treatment: string;
};

const TREATMENT_PLACEHOLDER = "TODO: fill from authoritative agronomy source";

export const DISEASES: Record<string, DiseaseInfo> = {
  "Apple___Apple_scab": {
    name: "Apple — Apple Scab",
    crop: "Apple",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Apple___Black_rot": {
    name: "Apple — Black Rot",
    crop: "Apple",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Apple___Cedar_apple_rust": {
    name: "Apple — Cedar Apple Rust",
    crop: "Apple",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Apple___healthy": {
    name: "Apple — Healthy",
    crop: "Apple",
    treatment: "No action needed — plant appears healthy.",
  },
  "Blueberry___healthy": {
    name: "Blueberry — Healthy",
    crop: "Blueberry",
    treatment: "No action needed — plant appears healthy.",
  },
  "Cherry_(including_sour)___Powdery_mildew": {
    name: "Cherry — Powdery Mildew",
    crop: "Cherry",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Cherry_(including_sour)___healthy": {
    name: "Cherry — Healthy",
    crop: "Cherry",
    treatment: "No action needed — plant appears healthy.",
  },
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
    name: "Corn — Gray Leaf Spot",
    crop: "Corn (maize)",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Corn_(maize)___Common_rust_": {
    name: "Corn — Common Rust",
    crop: "Corn (maize)",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Corn_(maize)___Northern_Leaf_Blight": {
    name: "Corn — Northern Leaf Blight",
    crop: "Corn (maize)",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Corn_(maize)___healthy": {
    name: "Corn — Healthy",
    crop: "Corn (maize)",
    treatment: "No action needed — plant appears healthy.",
  },
  "Grape___Black_rot": {
    name: "Grape — Black Rot",
    crop: "Grape",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Grape___Esca_(Black_Measles)": {
    name: "Grape — Esca (Black Measles)",
    crop: "Grape",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
    name: "Grape — Leaf Blight (Isariopsis Leaf Spot)",
    crop: "Grape",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Grape___healthy": {
    name: "Grape — Healthy",
    crop: "Grape",
    treatment: "No action needed — plant appears healthy.",
  },
  "Orange___Haunglongbing_(Citrus_greening)": {
    name: "Orange — Huanglongbing (Citrus Greening)",
    crop: "Orange",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Peach___Bacterial_spot": {
    name: "Peach — Bacterial Spot",
    crop: "Peach",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Peach___healthy": {
    name: "Peach — Healthy",
    crop: "Peach",
    treatment: "No action needed — plant appears healthy.",
  },
  "Pepper,_bell___Bacterial_spot": {
    name: "Bell Pepper — Bacterial Spot",
    crop: "Bell Pepper",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Pepper,_bell___healthy": {
    name: "Bell Pepper — Healthy",
    crop: "Bell Pepper",
    treatment: "No action needed — plant appears healthy.",
  },
  "Potato___Early_blight": {
    name: "Potato — Early Blight",
    crop: "Potato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Potato___Late_blight": {
    name: "Potato — Late Blight",
    crop: "Potato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Potato___healthy": {
    name: "Potato — Healthy",
    crop: "Potato",
    treatment: "No action needed — plant appears healthy.",
  },
  "Raspberry___healthy": {
    name: "Raspberry — Healthy",
    crop: "Raspberry",
    treatment: "No action needed — plant appears healthy.",
  },
  "Soybean___healthy": {
    name: "Soybean — Healthy",
    crop: "Soybean",
    treatment: "No action needed — plant appears healthy.",
  },
  "Squash___Powdery_mildew": {
    name: "Squash — Powdery Mildew",
    crop: "Squash",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Strawberry___Leaf_scorch": {
    name: "Strawberry — Leaf Scorch",
    crop: "Strawberry",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Strawberry___healthy": {
    name: "Strawberry — Healthy",
    crop: "Strawberry",
    treatment: "No action needed — plant appears healthy.",
  },
  "Tomato___Bacterial_spot": {
    name: "Tomato — Bacterial Spot",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Early_blight": {
    name: "Tomato — Early Blight",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Late_blight": {
    name: "Tomato — Late Blight",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Leaf_Mold": {
    name: "Tomato — Leaf Mold",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Septoria_leaf_spot": {
    name: "Tomato — Septoria Leaf Spot",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Spider_mites Two-spotted_spider_mite": {
    name: "Tomato — Two-Spotted Spider Mite",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Target_Spot": {
    name: "Tomato — Target Spot",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
    name: "Tomato — Yellow Leaf Curl Virus",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___Tomato_mosaic_virus": {
    name: "Tomato — Mosaic Virus",
    crop: "Tomato",
    treatment: TREATMENT_PLACEHOLDER,
  },
  "Tomato___healthy": {
    name: "Tomato — Healthy",
    crop: "Tomato",
    treatment: "No action needed — plant appears healthy.",
  },
};

export function getDiseaseInfo(label: string): DiseaseInfo {
  const info = DISEASES[label];
  if (!info) {
    // Fail soft rather than throwing — an unknown label shouldn't crash a request.
    return { name: label, crop: "Unknown", treatment: TREATMENT_PLACEHOLDER };
  }
  return info;
}

export function getDiseaseName(label: string): string {
  return getDiseaseInfo(label).name;
}

export function getDiseaseTreatment(label: string): string {
  return getDiseaseInfo(label).treatment;
}

export function isHealthy(label: string): boolean {
  return label.toLowerCase().endsWith("healthy");
}