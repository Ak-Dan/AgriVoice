import express from "express";
import multer from "multer";
import { InferenceSession, Tensor } from "onnxruntime-node";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import type { Inference, Severity } from "../../common/index.ts";

const app = express();
const upload = multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MODEL_PATH = resolve(__dirname, "../../model/model.onnx");
const CLASS_DISEASES = [
  "rust",
  "greyLeaf",
  "healthy",
  "blight",
] as const;
const NORMALIZATION_MEAN = [
  0.43762004375457764,
  0.4983558654785156,
  0.787480592727661,
] as const;
const NORMALIZATION_STD = [
  0.43693873286247253,
  0.49755582213401794,
  0.37814345955848694,
] as const;

let session: InferenceSession | null = null;

function softmax(scores: number[]) {
  const maxScore = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - maxScore));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

function getSeverity(disease: Inference["output"], confidence: number): Severity {
  if (disease === "healthy") {
    return "low";
  }

  if (confidence >= 0.9) {
    return "high";
  }

  if (confidence >= 0.75) {
    return "medium";
  }

  return "low";
}

function decodePrediction(output: ArrayLike<number>) {
  const scores = Array.from(output, Number);
  const probabilities = softmax(scores);

  let topIndex = 0;
  for (let index = 1; index < probabilities.length; index += 1) {
    if (probabilities[index] > probabilities[topIndex]) {
      topIndex = index;
    }
  }
  
  const disease = CLASS_DISEASES[topIndex] ?? "healthy";

  return {
    disease,
    confidence: probabilities[topIndex] ?? 0,
    severity: getSeverity(disease, probabilities[topIndex] ?? 0),
  };
}

async function loadModel() {
  const model = await InferenceSession.create(MODEL_PATH);
  session = model;
  console.log("Model loaded from", MODEL_PATH);
  console.log("Inputs:", model.inputNames);
  console.log("Outputs:", model.outputNames);
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

async function handleInference(req: express.Request, res: express.Response) {
  try {
    if (!session) {
      return res.status(503).json({ error: "Model is still loading" });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const inputTensor = await preprocessImage(req.file.buffer);

    const feeds: Record<string, Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;

    const results = await session.run(feeds);
    const outputName = session.outputNames[0];
    const output = results[outputName]?.data;

    if (!output) {
      throw new Error(`Missing output tensor: ${outputName}`);
    }

    const prediction = decodePrediction(output as ArrayLike<number>);
    const response: Inference = {
      output: prediction.disease,
      confidence: Number(prediction.confidence.toFixed(4)),
      severity: prediction.severity,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Inference failed" });
  }
}

app.post("/infer", upload.single("image"), handleInference);

const PORT = 3000;

loadModel().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
