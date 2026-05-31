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

# DDP code to train on 2 GPUs
from torch.distributed import init_process_group, destroy_process_group
from torch.nn.parallel import DistributedDataParallel as DDP
import torch.distributed as dist

# Set up DDP
# torchrun command sets the env variables RANK, LOCAL_RANK, and WORLD_SIZE
ddp = int(os.environ.get('RANK', -1)) != -1 # Is this a DDP run?

if ddp:
    assert torch.cuda.is_available(), "CUDA needed for DDP"
    init_process_group(backend='nccl')
    ddp_rank = int(os.environ['RANK'])
    ddp_local_rank = int(os.environ['LOCAL_RANK'])
    ddp_world_size = int(os.environ['WORLD_SIZE'])
    device = f'cuda:{ddp_local_rank}'
    torch.cuda.set_device(device)

    master_process = ddp_rank == 0

else:
    # Vanilla, non-DDP run
    ddp_rank = 0
    ddp_local_rank = 0
    ddp_world_size = 1
    master_process = True

    device = 'cpu'
    if torch.cuda.is_available():
        device = 'cuda'

device_type = 'cuda' if device.startswith('cuda') else 'cpu'

torch.manual_seed(1337)
if torch.cuda.is_available():
    torch.cuda.manual_seed(1337)


# Point straight at the full PlantVillage "color" directory.
# It already contains one subfolder per class (38 classes), so no subsetting is needed.
# Adjust this path to match where the dataset is mounted in your environment.
DATA_DIR = "/content/PlantVillage-Dataset/raw/color"
IMG_SIZE = 224
EPOCHS = 30            # Pretrained backbone converges faster than from scratch; raise if needed.
LEARNING_RATE = 3e-4
BATCH_SIZE = 64
NUM_WORKERS = os.cpu_count()

# AUGMENTATION HPARAMS
MIXUP_ALPHA = 0.4
CUTMIX_ALPHA = 1.0
PROB_MIXUP = 0.4
PROB_CUTMIX = 0.4

# Label smoothing for generalization
LABEL_SMOOTHING = 0.1

TRAIN_SIZE = 0.95 # Use 95% of the images for training.

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
    MixUp/CutMix with explicit int32 casting on the permutation index.
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


def trainer():

    if master_process:
        print("[INFO] Loading datasets...")
        print(f"[INFO] Using {NUM_WORKERS} CPU cores!")
        print(f"[INFO] Using device: {device} Is DDP run: {ddp} World Size: {ddp_world_size}")

    full_dataset = datasets.ImageFolder(root=DATA_DIR)
    train_size = int(TRAIN_SIZE * len(full_dataset))
    val_size = len(full_dataset) - train_size

    # Number of classes is read directly from the folder structure (38 for full PlantVillage).
    num_classes = len(full_dataset.classes)

    # Calculate class weights to counter PlantVillage's heavy class imbalance.
    # Counts come straight from the ImageFolder targets.
    class_counts = np.bincount(full_dataset.targets)
    total_samples = len(full_dataset.targets)

    # Inverse-frequency weights
    weights = total_samples / (num_classes * class_counts)
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)

    if master_process:
        print(f"[INFO] Detected {num_classes} classes: {full_dataset.classes}")
        print(f"[INFO] Class counts: {class_counts}")
        print(f"[INFO] Applied Class Weights: {class_weights.cpu().numpy()}")

    train_split, val_split = random_split(full_dataset, [train_size, val_size])

    train_dataset =  TransformedDataset(train_split, train_transform)
    val_dataset = TransformedDataset(val_split, val_transform)

    train_sampler = DistributedSampler(train_dataset, num_replicas=ddp_world_size, rank=ddp_local_rank, shuffle=True)
    val_sampler = DistributedSampler(val_dataset, num_replicas=ddp_world_size, rank=ddp_local_rank, shuffle=False)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=train_sampler, num_workers=NUM_WORKERS, drop_last=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, sampler=val_sampler, num_workers=NUM_WORKERS, drop_last=True)

    # Load the ImageNet-pretrained backbone and swap in a fresh head for our classes.
    model = torchvision.models.mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)

    fc = nn.Linear(in_features=1280, out_features=num_classes)

    # Drop the head and replace it with ours
    model.classifier[1] = fc

    model.to(device)

    if ddp:
        model = DDP(model, device_ids=[ddp_local_rank])

    raw_model = model.module if ddp else model

    lr_scaled = LEARNING_RATE
    optimizer = AdamW(model.parameters(), lr=lr_scaled, weight_decay=0.05)

    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING, weight=class_weights)

    scheduler = CosineAnnealingLR(optimizer=optimizer, T_max=EPOCHS)
    log_file = "training_log.csv"

    if master_process:
        with open(log_file, mode='w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow('Epoch Train_Loss Train_Acc Val_Acc'.split())

    best_acc = 0.0

    for epoch in range(1, EPOCHS + 1):
        train_sampler.set_epoch(epoch)
        model.train() # Set model to training mode

        train_loss = 0.0
        correct = 0
        total = 0

        if master_process:
            pbar = tqdm(train_loader, total=len(train_loader), desc=f"Epoch {epoch}/{EPOCHS+1} [Train]")
            loader_iter = pbar
        else:
            loader_iter = train_loader

        for inputs, targets in loader_iter:
            # clear gradients
            optimizer.zero_grad()

            # Push inputs to the device
            inputs, targets = inputs.to(device), targets.to(device)

            inputs, targets_a, targets_b, lam, aug_type = mixup_cutmix_data(inputs, targets) # use default params

            outputs = model(inputs)

            loss = lam * criterion(outputs, targets_a) + (1. - lam) * criterion(outputs, targets_b)

            loss.backward()

            optimizer.step()

            with torch.no_grad():
                train_loss += loss.item()
                _, predicted = outputs.max(1)
                target_dominant = targets_a if lam >= 0.5 else targets_b
                total += targets.size(0)
                correct += predicted.eq(target_dominant).sum().item()

                if master_process:
                    pbar.set_postfix(loss=f"{loss.item():.4f}", type=aug_type)
        
        # Collect and sum all the train losses from each worker
        if ddp:
            # Convert to tensors of NCCL backend reduction
            loss_t = torch.tensor(train_loss, device=device)
            correct_t = torch.tensor(correct, device=device)
            total_t = torch.tensor(total, device=device)


            dist.all_reduce(loss_t, op= dist.ReduceOp.SUM)
            dist.all_reduce(correct_t, op=dist.ReduceOp.SUM)
            dist.all_reduce(total_t, op=dist.ReduceOp.SUM)

            # Extract the values back out
            train_loss = loss_t.item()
            correct = correct_t.item()
            total = total_t.item()
        
        avg_train_loss = train_loss / len(train_loader) / ddp_world_size
        train_acc = 100. * correct / total

        # Do evaluation after each epoch
        model.eval()

        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += targets.size(0)
                val_correct += predicted.eq(targets).sum().item()

        if ddp:
            correct_t = torch.tensor(val_correct, device=device)
            total_t = torch.tensor(val_total, device=device)

            dist.all_reduce(correct_t, op=dist.ReduceOp.SUM)
            dist.all_reduce(total_t, op=dist.ReduceOp.SUM)

            val_correct = correct_t.item()
            val_total = total_t.item()

        val_acc = 100. * val_correct / val_total

        if master_process:
            print(f"Epoch {epoch} | Loss: {avg_train_loss:.4f} | Train Acc (Approx): {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")

            with open(log_file, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([epoch, avg_train_loss, train_acc, val_acc])

        scheduler.step()

        if val_acc > best_acc:
            best_acc = val_acc
            if master_process:
                print(f"new best accuracy {best_acc:.2f}%! Saving model...")
                save_path = "mobilenet_v2_best.pt"
                model_cpu_state = {k: v.cpu() for k, v in raw_model.state_dict().items()}
                torch.save({
                    "model": model_cpu_state,
                    "epoch": epoch,
                    "best_acc": best_acc,
                    "classes": full_dataset.classes,   # label order for inference / confusion matrix
                    "num_classes": num_classes
                    }, save_path)
                print(f"Saved to: {save_path}")

if __name__ == "__main__":
    trainer()

    if ddp:
        destroy_process_group()