"""
AgriVoice — Model Evaluation Suite
==================================
Produces a rigorous evaluation of the trained 38-class MobileNetV2 model,
going beyond top-line accuracy to per-class precision / recall / F1, macro and
weighted averages, a normalized confusion matrix, and the specific
weakest/most-confused classes.

Runs on free compute (Colab T4 or CPU). Outputs:
  - classification_report.csv   (per-class precision/recall/F1/support)
  - metrics_summary.json        (headline + macro/weighted metrics)
  - confusion_matrix_eval.png   (raw counts)
  - confusion_matrix_norm.png   (row-normalized = per-class recall view)
  - top_confusions.csv          (the most-confused class pairs)

Usage (Colab):
  DATA_DIR  -> the PlantVillage color directory
  MODEL_PATH-> the trained checkpoint (mobilenet_v2_best.pt)
  Then: python evaluate.py
"""

import json
import csv
import numpy as np
import torch
import torchvision
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets
from torchvision.transforms import v2 as transforms
from sklearn.metrics import (
    confusion_matrix, classification_report,
    precision_recall_fscore_support, accuracy_score,
    top_k_accuracy_score,
)
import matplotlib.pyplot as plt
import seaborn as sns

# ---- config ----
DATA_DIR = "/content/PlantVillage-Dataset/raw/color"
MODEL_PATH = "/content/drive/MyDrive/plant_model/mobilenet_v2_best.pt"
IMG_SIZE = 224
BATCH_SIZE = 64
TRAIN_SIZE = 0.95          # must match training split to reconstruct the same val set
SEED = 1337

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

device = 'cuda' if torch.cuda.is_available() else 'cpu'
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed(SEED)

eval_transform = transforms.Compose([
    transforms.ToImage(),
    transforms.ToDtype(torch.float32, scale=True),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.Normalize(MEAN, STD),
])

def main():
    print("[INFO] Loading checkpoint...")
    ckpt = torch.load(MODEL_PATH, map_location=device, weights_only=False)
    class_names = ckpt.get("classes")
    num_classes = ckpt.get("num_classes", len(class_names) if class_names else None)

    model = torchvision.models.mobilenet_v2()
    model.classifier[1] = nn.Linear(in_features=1280, out_features=num_classes)
    model.load_state_dict(ckpt["model"])
    model = model.to(device).eval()

    print("[INFO] Loading dataset and reconstructing validation split...")
    full = datasets.ImageFolder(root=DATA_DIR, transform=eval_transform)
    if class_names is None:
        class_names = full.classes
    train_size = int(TRAIN_SIZE * len(full))
    val_size = len(full) - train_size
    _, val_split = random_split(full, [train_size, val_size])
    val_loader = DataLoader(val_split, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    print(f"[INFO] Evaluating on {len(val_split)} validation images across {num_classes} classes...")
    all_logits, all_targets = [], []
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs = inputs.to(device)
            logits = model(inputs)
            all_logits.append(logits.cpu().numpy())
            all_targets.extend(targets.numpy())
    all_logits = np.concatenate(all_logits, axis=0)
    all_preds = all_logits.argmax(axis=1)
    all_targets = np.array(all_targets)
    labels_idx = list(range(num_classes))

    # ---- headline metrics ----
    acc = accuracy_score(all_targets, all_preds)
    top3 = top_k_accuracy_score(all_targets, all_logits, k=3, labels=labels_idx)
    p_macro, r_macro, f_macro, _ = precision_recall_fscore_support(
        all_targets, all_preds, average="macro", zero_division=0, labels=labels_idx)
    p_w, r_w, f_w, _ = precision_recall_fscore_support(
        all_targets, all_preds, average="weighted", zero_division=0, labels=labels_idx)

    summary = {
        "accuracy": round(float(acc), 4),
        "top3_accuracy": round(float(top3), 4),
        "macro_precision": round(float(p_macro), 4),
        "macro_recall": round(float(r_macro), 4),
        "macro_f1": round(float(f_macro), 4),
        "weighted_precision": round(float(p_w), 4),
        "weighted_recall": round(float(r_w), 4),
        "weighted_f1": round(float(f_w), 4),
        "num_classes": int(num_classes),
        "val_images": int(len(val_split)),
    }
    with open("metrics_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("[INFO] Headline metrics:", json.dumps(summary, indent=2))

    # ---- per-class report ----
    p, r, f1, support = precision_recall_fscore_support(
        all_targets, all_preds, labels=labels_idx, zero_division=0)
    with open("classification_report.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["class", "precision", "recall", "f1", "support"])
        for i, name in enumerate(class_names):
            w.writerow([name, round(float(p[i]), 4), round(float(r[i]), 4),
                        round(float(f1[i]), 4), int(support[i])])
    print("[INFO] Wrote classification_report.csv")

    # ---- weakest classes (lowest F1) ----
    order = np.argsort(f1)
    print("\n[INFO] 5 weakest classes by F1:")
    for i in order[:5]:
        print(f"   {class_names[i]:45s} F1={f1[i]:.3f}  recall={r[i]:.3f}  support={support[i]}")

    # ---- confusion matrices ----
    cm = confusion_matrix(all_targets, all_preds, labels=labels_idx)
    _plot_cm(cm, class_names, "confusion_matrix_eval.png",
             "Validation Confusion Matrix (counts)", normalize=False)
    _plot_cm(cm, class_names, "confusion_matrix_norm.png",
             "Validation Confusion Matrix (row-normalized = recall)", normalize=True)

    # ---- top confused pairs (off-diagonal) ----
    pairs = []
    for i in range(num_classes):
        for j in range(num_classes):
            if i != j and cm[i, j] > 0:
                pairs.append((cm[i, j], class_names[i], class_names[j]))
    pairs.sort(reverse=True)
    with open("top_confusions.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["count", "true_class", "predicted_as"])
        for count, t, pj in pairs[:20]:
            w.writerow([int(count), t, pj])
    print("\n[INFO] Top confusions:")
    for count, t, pj in pairs[:8]:
        print(f"   {count:3d}x  {t}  ->  {pj}")

    print("\n[INFO] Evaluation complete. Files written:")
    print("   metrics_summary.json, classification_report.csv,")
    print("   confusion_matrix_eval.png, confusion_matrix_norm.png, top_confusions.csv")


def _plot_cm(cm, class_names, path, title, normalize):
    mat = cm.astype(float)
    if normalize:
        row_sums = mat.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1
        mat = mat / row_sums
    plt.figure(figsize=(22, 18))
    sns.heatmap(mat, annot=not normalize, fmt='d' if not normalize else '.2f',
                cmap='Blues', xticklabels=class_names, yticklabels=class_names,
                annot_kws={"size": 6}, cbar_kws={"shrink": 0.6},
                vmin=0, vmax=1 if normalize else None)
    plt.title(title, fontsize=16)
    plt.ylabel('Actual', fontsize=12)
    plt.xlabel('Predicted', fontsize=12)
    plt.xticks(rotation=90, fontsize=7)
    plt.yticks(rotation=0, fontsize=7)
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[INFO] Wrote {path}")


if __name__ == "__main__":
    main()