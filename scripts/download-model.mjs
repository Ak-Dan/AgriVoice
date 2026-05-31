import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";

const modelUrl = process.env.MODEL_URL;
const outputPath = resolve("model/model.onnx");

if (existsSync(outputPath)) {
  console.log(`Model already exists at ${outputPath}`);
  process.exit(0);
}

if (!modelUrl) {
  console.error("MODEL_URL is required to download model/model.onnx");
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });

console.log(`Downloading model from ${modelUrl}`);
const response = await fetch(modelUrl);

if (!response.ok || !response.body) {
  throw new Error(`Model download failed: ${response.status} ${response.statusText}`);
}

await pipeline(response.body, createWriteStream(outputPath));
console.log(`Model saved to ${outputPath}`);
