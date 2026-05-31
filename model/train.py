import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import datasets
import torchvision
from torchvision.models import MobileNet_V2_Weights
from torchvision.transforms import v2 as transforms
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tqdm import tqdm
import os, csv
import numpy as np


from torch.utils.data import random_split
from torch.utils.data.distributed import DistributedSampler
import torch_xla
import torch_xla.core.xla_model as xm
import torch_xla.distributed.xla_multiprocessing as xmp
import torch_xla.distributed.parallel_loader as pl
import torch_xla.runtime as xr


# Point straight at the full PlantVillage "color" directory.
# It already contains one subfolder per class (38 classes), so no subsetting is needed.
# Adjust this path to match where the dataset is mounted in your environment.
DATA_DIR = "/kaggle/input/plantvillage-dataset/color"
IMG_SIZE = 224
EPOCHS = 30                  # Pretrained backbone converges faster than from scratch; raise if needed.
LEARNING_RATE = 3e-4 * 8     # Scaled for 8 TPU cores.
BATCH_SIZE = 64
NUM_WORKERS = os.cpu_count()

# AUGMENTATION HPARAMS
MIXUP_ALPHA = 0.4
CUTMIX_ALPHA = 1.0
PROB_MIXUP = 0.4
PROB_CUTMIX = 0.4

# Label smoothing for generalization
LABEL_SMOOTHING = 0.1

TRAIN_SIZE = 0.8 # Use 80% of the images for training.

# ImageNet normalization stats. These match the ImageNet-pretrained MobileNetV2
# backbone we load below, so they are the correct choice here.
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]

train_transform = transforms.Compose([
    transforms.ToImage(),
    transforms.ToDtype(torch.float32, scale=True),
    transforms.RandomResizedCrop(IMG_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.2, 0.2, 0.2),
    transforms.Normalize(MEAN, STD)
])

val_transform = transforms.Compose([
    transforms.ToImage(),
    transforms.ToDtype(torch.float32, scale=True),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.Normalize(MEAN, STD)
])

def rand_bbox(size, lam):
    """
    Generates a random bounding box for CutMix.
    """
    W = size[2]
    H = size[3]
    cut_rat = np.sqrt(1. - lam) # Cut ratio
    cut_w = int(W * cut_rat)
    cut_h = int(H * cut_rat)

    # random center
    cx = np.random.randint(W)
    cy = np.random.randint(H)

    bbx1 = np.clip(cx - cut_w // 2, 0, W)
    bby1 = np.clip(cy - cut_h // 2, 0, H)

    bbx2 = np.clip(cx + cut_w // 2, 0, W)
    bby2 = np.clip(cy + cut_h // 2, 0, H)

    return bbx1, bby1, bbx2, bby2

def mixup_cutmix_data(x, y, alpha_mix=0.4, alpha_cut=1.0):
    """
    TPU-optimized MixUp/CutMix with explicit int32 casting to fix X64 RNG errors.
    """
    p = np.random.rand()
    batch_size, _, h, w = x.shape
    device = x.device

    if p < PROB_MIXUP:
        lam = float(np.random.beta(alpha_mix, alpha_mix))

        index = torch.randperm(batch_size, device=device, dtype=torch.int32)

        mixed_x = lam * x + (1 - lam) * x[index, :]
        y_a, y_b = y, y[index]

        return mixed_x, y_a, y_b, lam, "mixup"

    elif p < (PROB_MIXUP + PROB_CUTMIX):
        lam = float(np.random.beta(alpha_cut, alpha_cut))

        index = torch.randperm(batch_size, device=device, dtype=torch.int32)

        y_a, y_b = y, y[index]

        cut_rat = np.sqrt(1. - lam) # Cut ratio
        cut_w = int(w * cut_rat)
        cut_h = int(h * cut_rat)

        # random center
        cx = np.random.randint(w)
        cy = np.random.randint(h)

        bbx1 = np.clip(cx - cut_w // 2, 0, w)
        bby1 = np.clip(cy - cut_h // 2, 0, h)

        bbx2 = np.clip(cx + cut_w // 2, 0, w)
        bby2 = np.clip(cy + cut_h // 2, 0, h)

        mask_np = np.ones((h, w), dtype=np.float32)
        mask_np[bby1:bby2, bbx1:bbx2] = 0.0

        mask = torch.from_numpy(mask_np).to(device)
        mask = mask.view(1, 1, h, w)

        mixed_x = x * mask + x[index] * (1 - mask)

        lam = 1 - ((bbx2 - bbx1) * (bby2 - bby1) / (w * h))

        return mixed_x, y_a, y_b, lam, 'cutmix'

    else:
        return x, y, y, 1.0, 'none'

class TransformedDataset(Dataset):
    def __init__(self, subset, transform=None) -> None:
        super().__init__()

        self.subset = subset
        self.transform = transform

    def __getitem__(self, index):
        x, y = self.subset[index]

        if self.transform:
            x = self.transform(x)
        return x, y
    
    def __len__(self):
        return len(self.subset)


def _mp_fn(rank, flags):
    device = torch_xla.device()

    if xr.global_ordinal() == 0:
        print("[INFO] Loading datasets...")

    full_dataset = datasets.ImageFolder(root=DATA_DIR)
    train_size = int(TRAIN_SIZE * len(full_dataset))
    val_size = len(full_dataset) - train_size

    # Number of classes is read directly from the folder structure (38 for full PlantVillage).
    num_classes = len(full_dataset.classes)

    # Class weights to counter PlantVillage's heavy class imbalance.
    class_counts = np.bincount(full_dataset.targets)
    total_samples = len(full_dataset.targets)
    weights = total_samples / (num_classes * class_counts)
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)

    if xr.global_ordinal() == 0:
        print(f"[INFO] Detected {num_classes} classes: {full_dataset.classes}")
        print(f"[INFO] Class counts: {class_counts}")

    train_split, val_split = random_split(full_dataset, [train_size, val_size])

    train_dataset =  TransformedDataset(train_split, train_transform)
    val_dataset = TransformedDataset(val_split, val_transform)

    train_sampler = DistributedSampler(train_dataset, num_replicas=xr.world_size(), rank=xr.global_ordinal(), shuffle=True)
    val_sampler = DistributedSampler(val_dataset, num_replicas=xr.world_size(), rank=xr.global_ordinal(), shuffle=False)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=train_sampler, num_workers=NUM_WORKERS, drop_last=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, sampler=val_sampler, num_workers=NUM_WORKERS, drop_last=True)

    # Load the ImageNet-pretrained backbone and swap in a fresh head for our classes.
    model = torchvision.models.mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)

    fc = nn.Linear(in_features=1280, out_features=num_classes)

    # Drop the head and replace it with ours
    model.classifier[1] = fc
    model.to(device)

    lr_scaled = LEARNING_RATE
    optimizer = AdamW(model.parameters(), lr=lr_scaled, weight_decay=0.05)

    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING, weight=class_weights)

    scheduler = CosineAnnealingLR(optimizer=optimizer, T_max=EPOCHS)
    log_file = "training_log.csv"

    if xr.global_ordinal() == 0:
        with open(log_file, mode='w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow('Epoch Train_Loss Train_Acc Val_Acc'.split())

    best_acc = 0.0
    xm.rendezvous('initialization_complete')

    for epoch in range(1, EPOCHS + 1):
        train_sampler.set_epoch(epoch)
        model.train() # Set model to training mode

        para_train_loader = pl.ParallelLoader(train_loader, [device]).per_device_loader(device)

        train_loss = 0.0
        correct = 0
        total = 0

        if xr.global_ordinal() == 0:
            pbar = tqdm(para_train_loader, total=len(train_loader), desc=f"Epoch {epoch}/{EPOCHS+1} [Train]")
            loader_iter = pbar
        else:
            loader_iter = para_train_loader

        for inputs, targets in loader_iter:
            # clear gradients
            optimizer.zero_grad()

            inputs, targets_a, targets_b, lam, aug_type = mixup_cutmix_data(inputs, targets) # use default params

            outputs = model(inputs)

            loss = lam * criterion(outputs, targets_a) + (1. - lam) * criterion(outputs, targets_b)

            loss.backward()

            # TPU style optimizer step
            xm.optimizer_step(optimizer)

            with torch.no_grad():
                train_loss += loss.item()
                _, predicted = outputs.max(1)
                target_dominant = targets_a if lam >= 0.5 else targets_b
                total += targets.size(0)
                correct += predicted.eq(target_dominant).sum().item()

                if xr.global_ordinal() == 0:
                    pbar.set_postfix(loss=f"{loss.item():.4f}", type=aug_type)
        
        # Collect and sum all the train losses from each worker
        total_train_loss = xm.mesh_reduce('train_loss', train_loss, lambda x: sum(x))
        total_correct = xm.mesh_reduce('train_correct', correct, lambda x: sum(x))
        total_samples = xm.mesh_reduce('train_total', total, lambda x: sum(x))
        
        avg_train_loss = total_train_loss / len(train_loader) / xr.world_size()
        train_acc = 100. * total_correct / total_samples

        # Do evaluation after each epoch
        model.eval()
        para_val_loader = pl.ParallelLoader(val_loader, [device]).per_device_loader(device)

        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for inputs, targets in para_val_loader:
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += targets.size(0)
                val_correct += predicted.eq(targets).sum().item()

        total_val_correct = xm.mesh_reduce('val_correct', val_correct, lambda x: sum(x))
        total_val_samples = xm.mesh_reduce('val_total', val_total, lambda x: sum(x))
        
        val_acc = 100. * total_val_correct / total_val_samples

        if xr.global_ordinal() == 0:
            print(f"Epoch {epoch} | Loss: {avg_train_loss:.4f} | Train Acc (Approx): {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")

            with open(log_file, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([epoch, avg_train_loss, train_acc, val_acc])

        scheduler.step()

        if val_acc > best_acc:
            best_acc = val_acc
            if xr.global_ordinal() == 0:
                print(f"new best accuracy {best_acc:.2f}%! Saving model...")
                save_path = "mobilenet_v2_best.pt"
                model_cpu_state = {k: v.cpu() for k, v in model.state_dict().items()}
                optimizer_cpu_state = {
                        k: v.cpu() for k, v in optimizer.state_dict().items()
                        }
                torch.save({
                    "model": model_cpu_state,
                    "epoch": epoch,
                    "optimizer": optimizer_cpu_state,
                    "best_acc": best_acc,
                    "classes": full_dataset.classes,   # label order for inference / confusion matrix
                    "num_classes": num_classes
                    }, save_path)
                print(f"Saved to: {save_path}")

if __name__ == "__main__":
    if 'TPU_PROCESS_ADDRESSES' in os.environ:
        os.environ.pop('TPU_PROCESS_ADDRESSES')

    print(f"Starting TPU Training with Mixup/CutMix/Smoothing...")
    flags = []
    xmp.spawn(_mp_fn, args=(flags,), n_procs=None, start_method='fork')