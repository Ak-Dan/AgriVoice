import { describe, expect, it } from "vitest";
import { parseKnowledgeDocument, retrieveAgronomyGuidance } from "./retrieval.ts";

const maizeCommonRustGuide = parseKnowledgeDocument(`---
id: maize_common_rust_kalro
title: Maize Common Rust
crop: maize
disease: common rust
source_name: KALRO repository
source_url: https://example.com/maize-rust
retrieval_tags: [maize, corn, common rust, Puccinia sorghi]
---

## Farmer-Safe Guidance

- Plant resistant varieties where available.
- Scout leaves for rust pustules.
- Ask an extension worker about local fungicide guidance.

## Prevention

Use resistant varieties and monitor fields regularly.

## Escalation

Escalate when many maize plants show spreading pustules.
`);

const potatoLateBlightGuide = parseKnowledgeDocument(`---
id: potato_late_blight_kalro
title: Potato Late Blight
crop: potato
disease: late blight
source_name: KALRO repository
source_url: https://example.com/potato-blight
retrieval_tags: [potato, late blight]
---

## Farmer-Safe Guidance

- Use healthy seed tubers.
- Scout fields during wet weather.
`);

describe("retrieval", () => {
  it("retrieves disease-specific guidance for a matching model label", () => {
    const guidance = retrieveAgronomyGuidance("Corn_(maize)___Common_rust_", [
      maizeCommonRustGuide,
      potatoLateBlightGuide,
    ]);

    expect(guidance?.title).toBe("Maize Common Rust");
    expect(guidance?.sourceName).toBe("KALRO repository");
    expect(guidance?.guidance).toContain("Scout leaves for rust pustules.");
  });

  it("does not return crop-only guidance for an unmatched disease", () => {
    const guidance = retrieveAgronomyGuidance("Corn_(maize)___Northern_Leaf_Blight", [
      maizeCommonRustGuide,
    ]);

    expect(guidance).toBeNull();
  });

  it("does not retrieve guidance for healthy predictions", () => {
    const guidance = retrieveAgronomyGuidance("Potato___healthy", [potatoLateBlightGuide]);

    expect(guidance).toBeNull();
  });
});
