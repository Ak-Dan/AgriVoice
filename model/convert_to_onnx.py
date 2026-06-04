import argparse
import json
import os

import torch
import torch.nn as nn
import torch.onnx
from onnxruntime.quantization import QuantType, quantize_dynamic
from torchvision import models


def parse_args():
    parser = argparse.ArgumentParser(description="Export an AgriVoice MobileNetV2 checkpoint to ONNX.")
    parser.add_argument("--model-path", default="/content/drive/MyDrive/plant_model/mobilenet_v2_best.pt")
    parser.add_argument("--onnx-path", default="model.onnx")
    parser.add_argument("--quantized-path", default="model_int8.onnx")
    parser.add_argument("--labels-path", default="labels.json")
    return parser.parse_args()


args = parse_args()

print("Loading checkpoint...")
device = torch.device("cpu")
ckpt = torch.load(args.model_path, map_location="cpu", weights_only=False)

class_names = ckpt.get("classes")
num_classes = ckpt.get("num_classes", len(class_names) if class_names else None)
print(f"Building head for {num_classes} classes")

model = models.mobilenet_v2()
fc = nn.Linear(in_features=1280, out_features=num_classes)
model.classifier[1] = fc
model.load_state_dict(ckpt["model"])
model.to(device=device)
model.eval()

if class_names is not None:
    with open(args.labels_path, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)
    print(f"Wrote {len(class_names)} labels to {args.labels_path}")

if os.path.exists(args.onnx_path):
    os.remove(args.onnx_path)
if os.path.exists(args.quantized_path):
    os.remove(args.quantized_path)

dummy_input = torch.randn(1, 3, 224, 224)

print("Exporting to ONNX...")
torch.onnx.export(
    model,
    dummy_input,
    args.onnx_path,
    export_params=True,
    opset_version=12,
    do_constant_folding=True,
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
    dynamo=False,
)
print(f"ONNX export successful: {args.onnx_path}")

print("Quantizing to int8...")
quantize_dynamic(args.onnx_path, args.quantized_path, weight_type=QuantType.QUInt8)
print(f"Quantization successful: {args.quantized_path}")
