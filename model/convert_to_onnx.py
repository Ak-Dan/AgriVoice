import torch
import torch.nn as nn
from torchvision import models
import torch.onnx
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

MODEL_PATH = "mobilenet_v2_best.pt"
ONNX_PATH = "model.onnx"
QUANTIZED_PATH = "model_int8.onnx"

print(f"Loading checkpoint...")
device = torch.device('cpu')
ckpt = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
model = models.mobilenet_v2()

fc = nn.Linear(in_features=1280, out_features=4) # We have 4 classes
model.classifier[1] = fc

model.load_state_dict(ckpt['model'])
model.to(device=device)

# Set model to evaluation mode
model.eval()

# Remove old failed files to ensure we don't load garbage
if os.path.exists(ONNX_PATH): os.remove(ONNX_PATH)
if os.path.exists(QUANTIZED_PATH): os.remove(QUANTIZED_PATH)

# Dummy input
dummy_input = torch.randn(1, 3, 224, 224)

print("Exporting to ONNX (Force Legacy Mode)...")
try:
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_PATH,
        export_params=True,
        opset_version=12, 
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        dynamo=False
    )
    print(f"✅ ONNX Export Successful: {ONNX_PATH}")
except Exception as e:
    print(f"❌ Export Failed: {e}")
    exit(1)

print("Quantizing to Int8...")
try:
    quantize_dynamic(
        ONNX_PATH,
        QUANTIZED_PATH,
        weight_type=QuantType.QUInt8
    )
    print(f"✅ Quantization Successful: {QUANTIZED_PATH}")
    print(f"File ready for Flutter: {QUANTIZED_PATH}")
except Exception as e:
    print(f"❌ Quantization Failed: {e}")
