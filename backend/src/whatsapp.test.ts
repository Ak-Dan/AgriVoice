import { describe, expect, it } from "vitest";
import {
  buildTwilioAuthHeader,
  formatWhatsAppDiagnosis,
  getIncomingImageUrl,
  twimlMessage,
} from "./whatsapp.ts";

describe("WhatsApp webhook helpers", () => {
  it("extracts the first incoming image media URL", () => {
    expect(
      getIncomingImageUrl({
        NumMedia: "1",
        MediaContentType0: "image/jpeg",
        MediaUrl0: "https://api.twilio.com/media/example",
      }),
    ).toBe("https://api.twilio.com/media/example");
  });

  it("rejects messages without image media", () => {
    expect(getIncomingImageUrl({ NumMedia: "0" })).toBeNull();
    expect(
      getIncomingImageUrl({
        NumMedia: "1",
        MediaContentType0: "audio/ogg",
        MediaUrl0: "https://api.twilio.com/media/audio",
      }),
    ).toBeNull();
  });

  it("escapes XML in TwiML responses", () => {
    expect(twimlMessage("A & B < C")).toContain("A &amp; B &lt; C");
  });

  it("builds Twilio media basic auth when credentials are present", () => {
    const header = buildTwilioAuthHeader({
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "secret",
    });

    expect(header).toBe(`Basic ${Buffer.from("AC123:secret").toString("base64")}`);
  });

  it("formats a diagnosis reply for WhatsApp", () => {
    const reply = formatWhatsAppDiagnosis({
      output: "Corn_(maize)___Common_rust_",
      confidence: 0.82,
      severity: "medium",
    });

    expect(reply).toContain("AgriVoice diagnosis");
    expect(reply).toContain("82%");
    expect(reply).toContain("Severity: medium");
  });
});
