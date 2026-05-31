import { afterEach, describe, expect, it, vi } from "vitest";
import { diagnoseLeaf } from "../src/api";

function makeImageFile() {
  return new File(["leaf"], "leaf.jpg", { type: "image/jpeg" });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("diagnoseLeaf", () => {
  it("maps known maize model labels to polished UI keys", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          output: "Corn_(maize)___Common_rust_",
          confidence: 0.87,
          severity: "medium",
        }),
      })),
    );

    const result = await diagnoseLeaf(makeImageFile());

    expect(result.error).toBeNull();
    expect(result.diagnosis).toMatchObject({
      disease: "rust",
      rawLabel: "Corn_(maize)___Common_rust_",
      recognized: true,
      healthy: false,
      confidence: 0.87,
      severity: "medium",
    });
  });

  it("does not silently map unknown backend labels to healthy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          output: "Unexpected___label",
          confidence: 0.42,
          severity: "low",
        }),
      })),
    );

    const result = await diagnoseLeaf(makeImageFile());

    expect(result.diagnosis).toMatchObject({
      disease: "unknown",
      rawLabel: "Unexpected___label",
      recognized: false,
      healthy: false,
    });
  });

  it("returns a readable error when the backend rejects the upload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: "No image uploaded" }),
      })),
    );

    const result = await diagnoseLeaf(makeImageFile());

    expect(result.diagnosis).toBeNull();
    expect(result.error).toBe("No image uploaded");
  });
});
