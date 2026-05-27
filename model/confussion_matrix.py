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
MAIZE_DIR = "Maize"
IMG_SIZE = 224
BATCH_SIZE = 64
TRAIN_SIZE = 0.95

MEAN = [0.43762004375457764, 0.4983558654785156, 0.787480592727661]
STD  = [0.43693873286247253, 0.49755582213401794, 0.37814345955848694]

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

# 3. Load and Split Data
full_dataset = datasets.ImageFolder(root=MAIZE_DIR, transform=eval_transform)
train_size = int(TRAIN_SIZE * len(full_dataset))
val_size = len(full_dataset) - train_size

# Because the seed is 1337, this split is mathematically identical to your training run
train_split, _ = random_split(full_dataset, [train_size, val_size])

train_loader = DataLoader(train_split, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
class_names = full_dataset.classes

# 4. Load the Model and Weights
print("[INFO] Loading Model...")
model = torchvision.models.mobilenet_v2()
model.classifier[1] = nn.Linear(in_features=1280, out_features=4)

# Load the saved state dictionary
checkpoint = torch.load("mobilenet_v2_best.pt", map_location=device)
model.load_state_dict(checkpoint['model'])

model = model.to(device)
model.eval()

# 5. Run Inference
all_preds = []
all_targets = []

print("[INFO] Generating Predictions...")
with torch.no_grad():
    for inputs, targets in train_loader:
        inputs = inputs.to(device)
        outputs = model(inputs)
        _, predicted = outputs.max(1)
        
        # Move back to CPU for sklearn
        all_preds.extend(predicted.cpu().numpy())
        all_targets.extend(targets.numpy())

# 6. Compute and Plot Confusion Matrix
cm = confusion_matrix(all_targets, all_preds)

plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=class_names, 
            yticklabels=class_names,
            annot_kws={"size": 14}) # Make numbers easier to read

plt.title(f'Training Set Confusion Matrix (Best Val Acc: {checkpoint["best_acc"]:.2f}%)', fontsize=16)
plt.ylabel('Actual True Disease', fontsize=12)
plt.xlabel('Model Predicted Disease', fontsize=12)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig("confussion_matrix")
plt.show()
