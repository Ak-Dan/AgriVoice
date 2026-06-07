import type { Inference } from "../../common/index.ts";
import { getDiseaseName, getDiseaseTreatment, isHealthy } from "../../common/diseases.ts";

export type TwilioWebhookBody = {
  Body?: string;
  From?: string;
  MediaContentType0?: string;
  MediaUrl0?: string;
  NumMedia?: string;
};

const PLACEHOLDER_TREATMENT = "TODO: fill from authoritative agronomy source";

export function getIncomingImageUrl(payload: TwilioWebhookBody): string | null {
  const mediaCount = Number(payload.NumMedia ?? 0);
  const contentType = payload.MediaContentType0 ?? "";

  if (mediaCount < 1 || !payload.MediaUrl0) {
    return null;
  }

  if (!contentType.toLowerCase().startsWith("image/")) {
    return null;
  }

  return payload.MediaUrl0;
}

export function buildTwilioAuthHeader(env = process.env): string | undefined {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return undefined;
  }

  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export function twimlMessage(message: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    `<Message>${escapeXml(message)}</Message>`,
    "</Response>",
  ].join("");
}

export function formatWhatsAppDiagnosis(inference: Inference): string {
  const diseaseName = getDiseaseName(inference.output);
  const confidence = Math.round(inference.confidence * 100);
  const treatment = getDiseaseTreatment(inference.output);
  const ragGuidance = formatAgronomyGuidance(inference);
  const treatmentLine =
    treatment === PLACEHOLDER_TREATMENT
      ? "Treatment guidance for this crop is still being reviewed. Please consult a local extension worker before applying chemicals."
      : treatment;

  const caution =
    inference.confidence < 0.7
      ? "\n\nConfidence is low. Please retake the photo in clear light or ask an agronomist to confirm."
      : "";

  if (isHealthy(inference.output)) {
    return [
      `AgriVoice diagnosis: ${diseaseName}`,
      `Confidence: ${confidence}%`,
      "The plant appears healthy. Keep monitoring and send another photo if symptoms appear.",
      caution,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `AgriVoice diagnosis: ${diseaseName}`,
    `Confidence: ${confidence}%`,
    `Severity: ${inference.severity}`,
    `Guidance: ${ragGuidance ?? treatmentLine}`,
    caution,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatAgronomyGuidance(inference: Inference): string | null {
  const agronomy = inference.agronomy;
  if (!agronomy) {
    return null;
  }

  const guidance = agronomy.guidance.slice(0, 3).map((item) => `- ${item}`);
  const source = `Source: ${agronomy.sourceName}`;

  return [...guidance, source].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
