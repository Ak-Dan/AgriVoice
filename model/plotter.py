import pandas as pd
import matplotlib.pyplot as plt


def plot_history(csv_path):
    try:
        data = pd.read_csv(csv_path)
    except FileNotFoundError:
        print("Log file not found. Did the training start?")
        return

    fig, ax1 = plt.subplots(figsize=(10, 6))

    # Plot Accuracy
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy (%)", color="tab:blue")
    ax1.plot(
        data["Epoch"],
        data["Train_Acc"],
        label="Train Acc",
        color="tab:blue",
        linestyle="--",
    )
    ax1.plot(
        data["Epoch"], data["Val_Acc"], label="Val Acc", color="tab:blue", linewidth=2
    )
    ax1.tick_params(axis="y", labelcolor="tab:blue")
    ax1.legend(loc="upper left")
    ax1.grid(True, alpha=0.3)

    # Plot Loss on a secondary Y-axis
    ax2 = ax1.twinx()
    ax2.set_ylabel("Loss", color="tab:red")
    ax2.plot(data["Epoch"], data["Train_Loss"], label="Train Loss", color="tab:red")
    ax2.tick_params(axis="y", labelcolor="tab:red")
    ax2.legend(loc="upper right")

    plt.title("Training History: MobileNetV2 on PlantVillage Maize dataset")
    plt.tight_layout()
    plt.savefig("training_log.png", dpi=150, bbox_inches="tight")
    plt.show()


# Run it
plot_history("training_log.csv")
