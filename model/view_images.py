import torch
import torchvision
from torchvision.transforms import v2 as transforms
from matplotlib import pyplot as plt
from torch.utils.data import DataLoader, Dataset
import torchvision

MEAN = [0.43762004375457764, 0.4983558654785156, 0.787480592727661]
STD = [0.43693873286247253, 0.49755582213401794, 0.37814345955848694]

BATCH_SIZE = 16
IMG_SIZE = 224
# print(f"Mean: {MEAN} | STD: {STD}")

train_transform = transforms.Compose(
    [
        transforms.ToImage(),
        transforms.ToDtype(torch.float32, scale=True),
        transforms.RandomResizedCrop(IMG_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.2, 0.2, 0.2),
        transforms.Normalize(MEAN, STD),
    ]
)

val_transform = transforms.Compose(
    [
        transforms.ToImage(),
        transforms.ToDtype(torch.float32, scale=True),
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.Normalize(MEAN, STD),
    ]
)


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


full_dataset = torchvision.datasets.ImageFolder(root="Maize")
dataset = TransformedDataset(full_dataset, transform=train_transform)
loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

print(full_dataset.classes)
print(full_dataset.class_to_idx)
device = "cpu"
model = torchvision.models.mobilenet_v2()
model.classifier[1] = torch.nn.Linear(1280, 4)
model.load_state_dict(
    torch.load("mobilenet_v2_best.pt", map_location="cpu", weights_only=True)["model"]
)
model.to(device)
model.eval()

for images, labels in loader:
    # Images is [16, 3, 224, 224]
    out = model(images)
    out = out.max(1)[1]
    figs, axes = plt.subplots(
        ncols=4, nrows=4, sharex=True, sharey=True, figsize=(20, 20)
    )
    images = images.permute(0, 2, 3, 1).numpy()
    labels = labels.tolist()

    axes = axes.flatten()

    for i in range(BATCH_SIZE):
        img = images[i]
        img = img * STD + MEAN
        img = img.clip(0, 1)
        axes[i].imshow(img)
        axes[i].axis("off")

        axes[i].set_title(
            full_dataset.classes[labels[i]] + f"|{full_dataset.classes[out[i]]}"
        )

    plt.savefig("images.png")
    plt.show()
    break
