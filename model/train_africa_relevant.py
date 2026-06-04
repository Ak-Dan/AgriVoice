import argparse
import csv
import json
import os
from pathlib import Path

import numpy as np
import torch
import torchvision
from torch import nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import datasets
from torchvision.models import MobileNet_V2_Weights
from torchvision.transforms import v2 as transforms
from tqdm import tqdm


IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
MIXUP_ALPHA = 0.4
CUTMIX_ALPHA = 1.0
PROB_MIXUP = 0.4
PROB_CUTMIX = 0.4
LABEL_SMOOTHING = 0.1


class FilteredImageFolder(Dataset):
    def __init__(self, root: str, included_classes: list[str], transform=None) -> None:
        self.base = datasets.ImageFolder(root=root)
        self.transform = transform
        missing = sorted(set(included_classes) - set(self.base.classes))
        if missing:
            raise ValueError(f"Missing classes in dataset: {missing}")

        self.classes = [name for name in self.base.classes if name in included_classes]
        self.class_to_idx = {name: index for index, name in enumerate(self.classes)}
        selected = {self.base.class_to_idx[name]: self.class_to_idx[name] for name in self.classes}
        self.samples = [
            (path, selected[class_index])
            for path, class_index in self.base.samples
            if class_index in selected
        ]
        self.targets = [class_index for _, class_index in self.samples]

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int):
        path, target = self.samples[index]
        image = self.base.loader(path)
        if self.transform:
            image = self.transform(image)
        return image, target


def build_train_transform():
    return transforms.Compose(
        [
            transforms.ToImage(),
            transforms.ToDtype(torch.float32, scale=True),
            transforms.RandomResizedCrop(IMG_SIZE, scale=(0.65, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomPerspective(distortion_scale=0.3, p=0.3),
            transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25, hue=0.03),
            transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
            transforms.RandomGrayscale(p=0.05),
            transforms.Normalize(MEAN, STD),
        ]
    )


def build_val_transform():
    return transforms.Compose(
        [
            transforms.ToImage(),
            transforms.ToDtype(torch.float32, scale=True),
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.Normalize(MEAN, STD),
        ]
    )


def mixup_cutmix_data(x, y):
    p = np.random.rand()
    batch_size, _, h, w = x.shape
    device = x.device

    if p < PROB_MIXUP:
        lam = float(np.random.beta(MIXUP_ALPHA, MIXUP_ALPHA))
        index = torch.randperm(batch_size, device=device)
        return lam * x + (1 - lam) * x[index], y, y[index], lam, "mixup"

    if p < (PROB_MIXUP + PROB_CUTMIX):
        lam = float(np.random.beta(CUTMIX_ALPHA, CUTMIX_ALPHA))
        index = torch.randperm(batch_size, device=device)
        cut_rat = np.sqrt(1.0 - lam)
        cut_w = int(w * cut_rat)
        cut_h = int(h * cut_rat)
        cx = np.random.randint(w)
        cy = np.random.randint(h)
        bbx1 = np.clip(cx - cut_w // 2, 0, w)
        bby1 = np.clip(cy - cut_h // 2, 0, h)
        bbx2 = np.clip(cx + cut_w // 2, 0, w)
        bby2 = np.clip(cy + cut_h // 2, 0, h)
        mixed_x = x.clone()
        mixed_x[:, :, bby1:bby2, bbx1:bbx2] = x[index, :, bby1:bby2, bbx1:bbx2]
        lam = 1 - ((bbx2 - bbx1) * (bby2 - bby1) / (w * h))
        return mixed_x, y, y[index], lam, "cutmix"

    return x, y, y, 1.0, "none"


def load_class_config(config_path: str) -> list[str]:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)["plantvillage_classes"]


def train(args):
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    classes = load_class_config(args.class_config)
    full_dataset = FilteredImageFolder(args.data_dir, classes)
    train_size = int(args.train_size * len(full_dataset))
    val_size = len(full_dataset) - train_size
    generator = torch.Generator().manual_seed(args.seed)
    train_split, val_split = random_split(full_dataset, [train_size, val_size], generator=generator)

    train_split.dataset.transform = build_train_transform()
    val_split.dataset.transform = build_val_transform()
    train_loader = DataLoader(train_split, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, drop_last=True)
    val_loader = DataLoader(val_split, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)

    class_counts = np.bincount(full_dataset.targets, minlength=len(full_dataset.classes))
    weights = len(full_dataset.targets) / (len(full_dataset.classes) * class_counts)
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)

    model = torchvision.models.mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(in_features=1280, out_features=len(full_dataset.classes))
    model.to(device)
    optimizer = AdamW(model.parameters(), lr=args.learning_rate, weight_decay=args.weight_decay)
    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING, weight=class_weights)
    scheduler = CosineAnnealingLR(optimizer=optimizer, T_max=args.epochs)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    log_path = output_dir / "africa_relevant_training_log.csv"
    checkpoint_path = output_dir / "mobilenet_v2_africa_relevant_best.pt"

    with open(log_path, mode="w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow(["epoch", "train_loss", "train_acc_approx", "val_acc"])

    print(f"[INFO] Device: {device}")
    print(f"[INFO] Classes ({len(full_dataset.classes)}): {full_dataset.classes}")
    print(f"[INFO] Class counts: {class_counts.tolist()}")

    best_acc = 0.0
    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0
        progress = tqdm(train_loader, desc=f"Epoch {epoch}/{args.epochs} [Train]")
        for inputs, targets in progress:
            inputs = inputs.to(device)
            targets = targets.to(device)
            optimizer.zero_grad()
            inputs, targets_a, targets_b, lam, aug_type = mixup_cutmix_data(inputs, targets)
            outputs = model(inputs)
            loss = lam * criterion(outputs, targets_a) + (1.0 - lam) * criterion(outputs, targets_b)
            loss.backward()
            optimizer.step()
            with torch.no_grad():
                train_loss += loss.item()
                _, predicted = outputs.max(1)
                dominant_target = targets_a if lam >= 0.5 else targets_b
                total += targets.size(0)
                correct += predicted.eq(dominant_target).sum().item()
                progress.set_postfix(loss=f"{loss.item():.4f}", aug=aug_type)

        scheduler.step()
        train_acc = 100.0 * correct / total
        avg_train_loss = train_loss / len(train_loader)
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs = inputs.to(device)
                targets = targets.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += targets.size(0)
                val_correct += predicted.eq(targets).sum().item()

        val_acc = 100.0 * val_correct / val_total
        print(f"Epoch {epoch} | Loss: {avg_train_loss:.4f} | Train Acc Approx: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")
        with open(log_path, mode="a", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow([epoch, avg_train_loss, train_acc, val_acc])

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(
                {
                    "model": model.state_dict(),
                    "epoch": epoch,
                    "best_acc": best_acc,
                    "classes": full_dataset.classes,
                    "num_classes": len(full_dataset.classes),
                    "scope": "agri_voice_africa_relevant_plantvillage_subset",
                },
                checkpoint_path,
            )
            print(f"[INFO] New best model saved to {checkpoint_path} ({best_acc:.2f}%)")


def parse_args():
    parser = argparse.ArgumentParser(description="Train an Africa-relevant AgriVoice model subset.")
    parser.add_argument("--data-dir", required=True, help="Path to PlantVillage raw/color directory.")
    parser.add_argument("--class-config", default="model/africa_relevant_classes.json")
    parser.add_argument("--output-dir", default="model/artifacts")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=0.05)
    parser.add_argument("--train-size", type=float, default=0.9)
    parser.add_argument("--num-workers", type=int, default=os.cpu_count() or 2)
    parser.add_argument("--seed", type=int, default=1337)
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
