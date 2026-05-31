import torch
import torchvision
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets
from torchvision.transforms import v2 as transforms
from sklearn.metrics import confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# 1. Setup Device & Constants
device = 'cuda' if torch.cuda.is_available() else 'cpu'
# Point at the full PlantVillage "color" directory (38 classes). Match this to your training path.
DATA_DIR = "/content/PlantVillage-Dataset/raw/color"
MODEL_PATH = "/content/drive/MyDrive/plant_model/mobilenet_v2_best.pt"
IMG_SIZE = 224
BATCH_SIZE = 64
TRAIN_SIZE = 0.95

# ImageNet normalization stats (must match what training used).
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]

# 2. Strict Seed for Dataset Reconstruction
torch.manual_seed(1337)
if torch.cuda.is_available():
    torch.cuda.manual_seed(1337)

# Use deterministic transforms (no random augmentations)
eval_transform = transforms.Compose([
    transforms.ToImage(),
    transforms.ToDtype(torch.float32, scale=True),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.Normalize(MEAN, STD)
])

# 3. Load the Model and Weights first, so we can read the saved class list
print("[INFO] Loading Model...")
checkpoint = torch.load(MODEL_PATH, map_location=device)

# Read class names / count straight from the checkpoint (set during training).
class_names = checkpoint.get("classes")
num_classes = checkpoint.get("num_classes", len(class_names) if class_names else None)

model = torchvision.models.mobilenet_v2()
model.classifier[1] = nn.Linear(in_features=1280, out_features=num_classes)
model.load_state_dict(checkpoint['model'])
model = model.to(device)
model.eval()

# 4. Load and Split Data
full_dataset = datasets.ImageFolder(root=DATA_DIR, transform=eval_transform)
train_size = int(TRAIN_SIZE * len(full_dataset))
val_size = len(full_dataset) - train_size

# Fall back to the folder order if the checkpoint somehow lacks class names.
if class_names is None:
    class_names = full_dataset.classes

# Because the seed is 1337, this split matches your training run.
# Evaluating on the held-out validation split gives a more honest matrix than the train split.
_, val_split = random_split(full_dataset, [train_size, val_size])

val_loader = DataLoader(val_split, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

# 5. Run Inference
all_preds = []
all_targets = []

print("[INFO] Generating Predictions...")
with torch.no_grad():
    for inputs, targets in val_loader:
        inputs = inputs.to(device)
        outputs = model(inputs)
        _, predicted = outputs.max(1)

        # Move back to CPU for sklearn
        all_preds.extend(predicted.cpu().numpy())
        all_targets.extend(targets.numpy())

# 6. Compute and Plot Confusion Matrix
# labels=range(num_classes) keeps the axes full-size even if some classes are
# absent from this particular validation split.
cm = confusion_matrix(all_targets, all_preds, labels=list(range(num_classes)))

# A 38x38 matrix needs a much larger canvas and smaller annotations than 4x4.
plt.figure(figsize=(22, 18))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=class_names,
            yticklabels=class_names,
            annot_kws={"size": 6},
            cbar_kws={"shrink": 0.6})

plt.title(f'Validation Confusion Matrix (Best Val Acc: {checkpoint["best_acc"]:.2f}%)', fontsize=16)
plt.ylabel('Actual True Disease', fontsize=12)
plt.xlabel('Model Predicted Disease', fontsize=12)
plt.xticks(rotation=90, fontsize=7)
plt.yticks(rotation=0, fontsize=7)
plt.tight_layout()
plt.savefig("confussion_matrix.png", dpi=150, bbox_inches="tight")
plt.show()             