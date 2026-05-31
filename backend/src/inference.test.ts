import { describe, expect, it } from "vitest";
import { decodePrediction, getSeverity, softmax } from "./inference.ts";

const labels = [
  "Apple___healthy",
  "Corn_(maize)___Common_rust_",
  "Tomato___Early_blight",
];

describe("inference helpers", () => {
  it("normalizes scores into probabilities", () => {
    const probabilities = softmax([1, 1, 1]);

    expect(probabilities).toHaveLength(3);
    expect(probabilities.reduce((total, value) => total + value, 0)).toBeCloseTo(1);
    expect(probabilities[0]).toBeCloseTo(1 / 3);
  });

  it("decodes the highest scoring PlantVillage label", () => {
    const prediction = decodePrediction([0.1, 3, 0.2], labels);

    expect(prediction.disease).toBe("Corn_(maize)___Common_rust_");
    expect(prediction.confidence).toBeGreaterThan(0.8);
  });

  it("keeps healthy labels low severity", () => {
    expect(getSeverity("Apple___healthy", 0.99)).toBe("low");
    expect(getSeverity("Tomato___Early_blight", 0.91)).toBe("high");
    expect(getSeverity("Corn_(maize)___Common_rust_", 0.8)).toBe("medium");
  });
});
