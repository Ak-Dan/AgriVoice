# Africa-Relevant Model Track

The current deployed model is a PlantVillage proof-of-concept. It proves the API, frontend, and WhatsApp flow, but several of its 38 labels are not priority crops for AgriVoice users in Nigeria, Kenya, and Ethiopia.

## Immediate Fine-Tune Scope

The first Africa-relevant model iteration should train on the PlantVillage classes that map best to smallholder priority crops already present in the dataset:

- Corn / maize
- Tomato
- Potato
- Bell pepper

The exact class list is stored in:

```text
model/africa_relevant_classes.json
```

This gives a smaller, more honest model than the full 38-class demo while keeping the current ONNX inference pipeline unchanged.

## Known Dataset Gaps

PlantVillage does not cover several high-priority African crops and diseases:

- Cassava mosaic disease
- Cassava brown streak disease
- Rice blast
- Cowpea / bean diseases
- Groundnut rosette
- Banana / plantain diseases
- Sorghum and millet diseases

Those require additional real field-photo datasets or partner/extension-worker data. Do not claim production readiness for those classes until they are trained and validated.

## Training

Example:

```bash
python model/train_africa_relevant.py \
  --data-dir /path/to/PlantVillage-Dataset/raw/color \
  --class-config model/africa_relevant_classes.json \
  --output-dir model/artifacts \
  --epochs 30
```

The script uses ImageNet MobileNetV2, ImageNet normalization, random crops, flips, color jitter, perspective distortion, Gaussian blur, random grayscale, MixUp, CutMix, label smoothing, and class weighting.

## Export

Example:

```bash
python model/convert_to_onnx.py \
  --model-path model/artifacts/mobilenet_v2_africa_relevant_best.pt \
  --onnx-path model/artifacts/model_africa_relevant.onnx \
  --quantized-path model/artifacts/model_africa_relevant_int8.onnx \
  --labels-path model/artifacts/labels_africa_relevant.json
```

After validation, copy the chosen ONNX file and labels into the backend deployment paths:

```text
model/model.onnx
model/labels.json
```

Then redeploy Render.
