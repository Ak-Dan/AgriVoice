import express from "express";
import multer from "multer";
import { InferenceSession, Tensor } from "onnxruntime-node";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import type { Inference } from "../../common/index.ts";
import {
  NORMALIZATION_MEAN,
  NORMALIZATION_STD,
  decodePrediction,
  loadClassLabels,
} from "./inference.ts";
import {
  buildTwilioAuthHeader,
  formatWhatsAppDiagnosis,
  getIncomingImageUrl,
  twimlMessage,
  type TwilioWebhookBody,
} from "./whatsapp.ts";
import { loadKnowledgeBase, retrieveAgronomyGuidance } from "./retrieval.ts";
import {
  createLangChainRagRetriever,
  getRagConfig,
  shouldUseChroma,
  type LangChainRagRetriever,
} from "./langchainRag.ts";

const app = express();
const upload = multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use the newly exported 38-class model. The float model.onnx (~8.7 MB) is the
// safest choice for onnxruntime-node; there is no size pressure server-side.
const MODEL_PATH = resolve(__dirname, "../../model/model.onnx");
const LABELS_PATH = resolve(__dirname, "../../model/labels.json");
const KNOWLEDGE_PATH = resolve(__dirname, "../../knowledge/disease_guides");

// Load the 38 class names in the EXACT order the model was trained on.
// labels.json is written by convert_to_onnx.py from the checkpoint's class list,
// so this stays in sync with the model automatically.
const CLASS_DISEASES = loadClassLabels(LABELS_PATH);
const KNOWLEDGE_BASE = loadKnowledgeBase(KNOWLEDGE_PATH);

let session: InferenceSession | null = null;
let ragRetriever: LangChainRagRetriever | null = null;

app.use(express.urlencoded({ extended: false }));

async function loadModel() {
  const model = await InferenceSession.create(MODEL_PATH);
  session = model;
  console.log("Model loaded from", MODEL_PATH);
  console.log("Loaded", CLASS_DISEASES.length, "class labels");
  console.log("Loaded", KNOWLEDGE_BASE.length, "RAG disease guides");
  console.log("Inputs:", model.inputNames);
  console.log("Outputs:", model.outputNames);

  if (shouldUseChroma()) {
    const ragConfig = {
      ...getRagConfig(),
      knowledgePath: KNOWLEDGE_PATH,
    };
    try {
      ragRetriever = await createLangChainRagRetriever(ragConfig);
      console.log(
        `LangChain/Chroma RAG enabled: ${ragConfig.collectionName} at ${ragConfig.chromaUrl}`,
      );
    } catch (error) {
      ragRetriever = null;
      console.warn("LangChain/Chroma RAG unavailable; using local markdown fallback.");
      console.warn(error);
    }
  } else {
    console.log("LangChain/Chroma RAG not configured; using local markdown fallback.");
  }

  return model;
}

async function preprocessImage(buffer: Buffer) {
  const image = await sharp(buffer)
    .resize(224, 224)
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer();

  const floatData = new Float32Array(1 * 3 * 224 * 224);

  for (let i = 0; i < 224 * 224; i++) {
    const red = image[i * 3] / 255.0;
    const green = image[i * 3 + 1] / 255.0;
    const blue = image[i * 3 + 2] / 255.0;

    floatData[i] = (red - NORMALIZATION_MEAN[0]) / NORMALIZATION_STD[0];
    floatData[i + 224 * 224] =
      (green - NORMALIZATION_MEAN[1]) / NORMALIZATION_STD[1];
    floatData[i + 2 * 224 * 224] =
      (blue - NORMALIZATION_MEAN[2]) / NORMALIZATION_STD[2];
  }

  return new Tensor("float32", floatData, [1, 3, 224, 224]);
}

app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.options("/infer", (_, res) => {
  res.sendStatus(204);
});

async function classifyImageBuffer(buffer: Buffer): Promise<Inference> {
  if (!session) {
    throw new Error("Model is still loading");
  }

  const inputTensor = await preprocessImage(buffer);

  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]] = inputTensor;

  const results = await session.run(feeds);
  const outputName = session.outputNames[0];
  const output = results[outputName]?.data;

  if (!output) {
    throw new Error(`Missing output tensor: ${outputName}`);
  }

  const prediction = decodePrediction(output as ArrayLike<number>, CLASS_DISEASES);
  const agronomy = await retrieveDiagnosisGuidance(prediction.disease);
  return {
    output: prediction.disease,
    confidence: Number(prediction.confidence.toFixed(4)),
    severity: prediction.severity,
    agronomy,
  };
}

async function retrieveDiagnosisGuidance(label: string) {
  if (ragRetriever) {
    try {
      const guidance = await ragRetriever.retrieve(label);
      if (guidance) {
        return guidance;
      }
    } catch (error) {
      console.warn("LangChain/Chroma retrieval failed; using local markdown fallback.");
      console.warn(error);
    }
  }

  return retrieveAgronomyGuidance(label, KNOWLEDGE_BASE);
}

async function handleInference(req: express.Request, res: express.Response) {
  try {
    if (!session) {
      return res.status(503).json({ error: "Model is still loading" });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const response = await classifyImageBuffer(req.file.buffer);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Inference failed" });
  }
}

app.post("/infer", upload.single("image"), handleInference);

app.post("/webhooks/twilio/whatsapp", async (req, res) => {
  try {
    const payload = req.body as TwilioWebhookBody;
    const mediaUrl = getIncomingImageUrl(payload);

    if (!mediaUrl) {
      res.type("text/xml").send(
        twimlMessage(
          "Send a clear crop leaf photo to AgriVoice and I will return a model-backed diagnosis.",
        ),
      );
      return;
    }

    if (!session) {
      res
        .type("text/xml")
        .send(twimlMessage("AgriVoice is still waking up. Please resend the photo in a minute."));
      return;
    }

    const headers: Record<string, string> = {};
    const authHeader = buildTwilioAuthHeader();
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const mediaResponse = await fetch(mediaUrl, { headers });
    if (!mediaResponse.ok) {
      throw new Error(`Twilio media download failed: ${mediaResponse.status}`);
    }

    const imageBuffer = Buffer.from(await mediaResponse.arrayBuffer());
    const inference = await classifyImageBuffer(imageBuffer);
    res.type("text/xml").send(twimlMessage(formatWhatsAppDiagnosis(inference)));
  } catch (err) {
    console.error(err);
    res.type("text/xml").send(
      twimlMessage(
        "Sorry, AgriVoice could not process that image. Please send a clear leaf photo and try again.",
      ),
    );
  }
});

const PORT = Number(process.env.PORT ?? 3000);

loadModel().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
