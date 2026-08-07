"""Train a Bi-GRU emotion classifier on the GoEmotions-derived 4-class set."""

import json
import os
import random
import shutil

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix

from common import LABELS, MODELS_DIR, PROCESSED_DIR, get_device

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


class BiGRUClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim=128, hidden_dim=128, num_classes=4, pad_idx=0):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=pad_idx)
        self.gru = nn.GRU(
            embed_dim, hidden_dim, batch_first=True, bidirectional=True
        )
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(hidden_dim * 2, num_classes)

    def forward(self, x):
        embedded = self.embedding(x)
        _, hidden = self.gru(embedded)
        # hidden: (2, batch, hidden_dim) -> concat forward/backward final states
        combined = torch.cat([hidden[0], hidden[1]], dim=1)
        return self.classifier(self.dropout(combined))


def load_split(name: str):
    data = np.load(os.path.join(PROCESSED_DIR, f"text_{name}.npz"))
    return data["sequences"], data["labels"]


def main():
    device = get_device()
    print(f"Using device: {device}")

    with open(os.path.join(PROCESSED_DIR, "text_vocab.json")) as f:
        vocab_meta = json.load(f)
    pad_idx = vocab_meta["pad_idx"]
    vocab_size = len(vocab_meta["vocab"])

    train_seq, train_labels = load_split("train")
    val_seq, val_labels = load_split("validation")
    test_seq, test_labels = load_split("test")
    print(f"Train: {len(train_labels)}, Val: {len(val_labels)}, Test: {len(test_labels)}")

    train_ds = torch.utils.data.TensorDataset(
        torch.from_numpy(train_seq), torch.from_numpy(train_labels)
    )
    val_ds = torch.utils.data.TensorDataset(
        torch.from_numpy(val_seq), torch.from_numpy(val_labels)
    )
    test_ds = torch.utils.data.TensorDataset(
        torch.from_numpy(test_seq), torch.from_numpy(test_labels)
    )

    class_counts = np.bincount(train_labels, minlength=len(LABELS))
    class_weights = torch.tensor(
        class_counts.sum() / (len(LABELS) * class_counts), dtype=torch.float32
    ).to(device)

    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=128, shuffle=True)
    val_loader = torch.utils.data.DataLoader(val_ds, batch_size=256)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=256)

    model = BiGRUClassifier(vocab_size=vocab_size, pad_idx=pad_idx, num_classes=len(LABELS)).to(
        device
    )
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    best_val_acc = 0.0
    best_state = None
    patience, patience_counter = 3, 0
    max_epochs = 20

    for epoch in range(max_epochs):
        model.train()
        total_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                preds = model(x).argmax(dim=1)
                correct += (preds == y).sum().item()
                total += y.size(0)
        val_acc = correct / total
        print(f"Epoch {epoch+1}: loss={total_loss/len(train_loader):.3f} val_acc={val_acc:.3f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch+1}")
                break

    model.load_state_dict(best_state)
    model.eval()

    all_preds, all_labels = [], []
    with torch.no_grad():
        for x, y in test_loader:
            x = x.to(device)
            preds = model(x).argmax(dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(y.numpy())

    report = classification_report(
        all_labels, all_preds, target_names=LABELS, output_dict=True, zero_division=0
    )
    cm = confusion_matrix(all_labels, all_preds)
    print("\nTest classification report:")
    print(classification_report(all_labels, all_preds, target_names=LABELS, zero_division=0))
    print("Confusion matrix:")
    print(cm)

    torch.save(
        {"state_dict": best_state, "vocab_size": vocab_size, "pad_idx": pad_idx},
        os.path.join(MODELS_DIR, "text_bigru.pt"),
    )
    shutil.copy(
        os.path.join(PROCESSED_DIR, "text_vocab.json"),
        os.path.join(MODELS_DIR, "text_vocab.json"),
    )
    with open(os.path.join(MODELS_DIR, "text_bigru_metrics.json"), "w") as f:
        json.dump(
            {
                "best_val_acc": best_val_acc,
                "test_report": report,
                "confusion_matrix": cm.tolist(),
                "labels": LABELS,
            },
            f,
            indent=2,
        )

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns

        plt.figure(figsize=(5, 4))
        sns.heatmap(cm, annot=True, fmt="d", xticklabels=LABELS, yticklabels=LABELS, cmap="Blues")
        plt.xlabel("Predicted")
        plt.ylabel("True")
        plt.title("Text Bi-GRU — Confusion Matrix (test set)")
        plt.tight_layout()
        plt.savefig(os.path.join(MODELS_DIR, "text_bigru_confusion_matrix.png"), dpi=150)
        print("Saved confusion matrix plot")
    except ImportError:
        pass

    print(f"\nSaved model + metrics to {MODELS_DIR}")


if __name__ == "__main__":
    main()
