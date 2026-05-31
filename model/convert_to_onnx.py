import json
import torch
import torch.nn as nn
from torchvision import models
import torch.onnx
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

MODEL_PATH = "/content/drive/MyDrive/plant_model/mobilenet_v2_best.pt"   # <-- Drive path
ONNX_PATH = "model.onnx"
QUANTIZED_PATH = "model_int8.onnx"
LABELS_PATH = "labels.json"

print(f"Loading checkpoint...")
device = torch.device('cpu')
ckpt = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)    # <-- False, dict checkpoint

class_names = ckpt.get("classes")
num_classes = ckpt.get("num_classes", len(class_names) if class_names else None)
print(f"Building head for {num_classes} classes")

model = models.mobilenet_v2()
fc = nn.Linear(in_features=1280, out_features=num_classes)
model.classifier[1] = fc

model.load_state_dict(ckpt['model'])
model.to(device=device)
model.eval()

if class_names is not None:
    with open(LABELS_PATH, "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"Wrote {len(class_names)} labels to {LABELS_PATH}")

if os.path.exists(ONNX_PATH): os.remove(ONNX_PATH)
if os.path.exists(QUANTIZED_PATH): os.remove(QUANTIZED_PATH)

dummy_input = torch.randn(1, 3, 224, 224)

print("Exporting to ONNX...")
try:
    torch.onnx.export(
        model, dummy_input, ONNX_PATH,
        export_params=True, opset_version=12, do_constant_folding=True,
        input_names=['input'], output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        dynamo=False
    )
    print(f"✅ ONNX Export Successful: {ONNX_PATH}")
except Exception as e:
    print(f"❌ Export Failed: {e}")
    raise

print("Quantizing to Int8...")
try:
    quantize_dynamic(ONNX_PATH, QUANTIZED_PATH, weight_type=QuantType.QUInt8)
    print(f"✅ Quantization Successful: {QUANTIZED_PATH}")
except Exception as e:
    print(f"❌ Quantization Failed: {e}")
    raise