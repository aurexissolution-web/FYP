"""Train the RAVDESS audio CNN with waveform augmentation + 6-fold
actor-grouped cross-validation, then train a final production model.

Why k-fold over actors, not a single train/val/test split: with only 24
actors, a single 3-actor test fold (as in the first version of this script)
has high variance -- a couple of unusually hard/easy voices can swing the
number a lot. Rotating 6 folds of 4 held-out actors each and averaging gives
a far more honest generalization estimate, which matters when this number is
going in an FYP report. The final deployed model is then trained once more
on a 20/4 actor train/val split (no held-out test -- the CV already answered
"how well does this generalize").
"""

import json
import os
import random

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix

from audio_features import N_FRAMES, N_MFCC, augment_waveform, extract_features, spec_augment
from common import LABELS, MODELS_DIR, PROCESSED_DIR, get_device

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

ACTOR_FOLDS = [list(range(i, i + 4)) for i in range(1, 25, 4)]  # six folds of 4 actors


class AudioCNN(nn.Module):
    """3-channel (MFCC + delta + delta2) CNN with global average pooling --
    keeps parameter count low relative to the ~650 training clips, unlike a
    flatten+large-FC head which overfits badly at this data scale."""

    def __init__(self, num_classes: int = 4):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.AdaptiveAvgPool2d(1),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.4),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


class AudioDataset(torch.utils.data.Dataset):
    def __init__(self, waveforms, labels, mean, std, augment=False, seed=0):
        self.waveforms = waveforms
        self.labels = labels
        self.mean = mean
        self.std = std
        self.augment = augment
        self.rng = np.random.default_rng(seed)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        signal = self.waveforms[idx]
        if self.augment:
            signal = augment_waveform(signal, self.rng)
        features = extract_features(signal)
        if self.augment:
            features = spec_augment(features, self.rng)
        features = (features - self.mean) / self.std
        return torch.from_numpy(features).float(), self.labels[idx]


def train_one_model(train_ds, val_ds, class_weights, device, max_epochs=60, patience=10):
    # Waveform augmentation (pitch shift / time stretch via librosa) is CPU-bound
    # and not cheap (~0.07s/clip) -- num_workers parallelizes it across cores
    # while the model trains on MPS, otherwise each epoch is dominated by
    # single-threaded feature extraction rather than actual training.
    train_loader = torch.utils.data.DataLoader(
        train_ds, batch_size=32, shuffle=True, num_workers=4, persistent_workers=True
    )
    val_loader = torch.utils.data.DataLoader(
        val_ds, batch_size=32, num_workers=2, persistent_workers=True
    )

    model = AudioCNN(num_classes=len(LABELS)).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

    best_val_acc, best_state, patience_counter = 0.0, None, 0

    for epoch in range(max_epochs):
        model.train()
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            optimizer.step()

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                preds = model(x).argmax(dim=1)
                correct += (preds == y).sum().item()
                total += y.size(0)
        val_acc = correct / total

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                break

    model.load_state_dict(best_state)
    model.eval()
    return model, best_val_acc, best_state


def evaluate(model, dataset, device):
    loader = torch.utils.data.DataLoader(dataset, batch_size=32)
    all_preds, all_labels = [], []
    with torch.no_grad():
        for x, y in loader:
            x = x.to(device)
            preds = model(x).argmax(dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(y.numpy())
    return np.array(all_labels), np.array(all_preds)


def main():
    device = get_device()
    print(f"Using device: {device}")
    print(f"Feature shape per clip: (3, {N_MFCC}, {N_FRAMES})")

    data = np.load(os.path.join(PROCESSED_DIR, "audio_waveforms.npz"))
    waveforms, labels, actors = data["waveforms"], data["labels"], data["actors"]

    # ---- 6-fold actor-grouped cross-validation ----
    fold_accuracies, fold_f1s = [], []
    all_cm = np.zeros((len(LABELS), len(LABELS)), dtype=int)

    for fold_idx, test_actors in enumerate(ACTOR_FOLDS):
        val_actors = ACTOR_FOLDS[(fold_idx + 1) % len(ACTOR_FOLDS)]
        train_actors = [a for a in range(1, 25) if a not in test_actors and a not in val_actors]

        train_mask = np.isin(actors, train_actors)
        val_mask = np.isin(actors, val_actors)
        test_mask = np.isin(actors, test_actors)

        train_wave, train_labels = waveforms[train_mask], labels[train_mask]
        # normalization stats from a sample of (unaugmented) train features
        sample_feats = np.stack([extract_features(w) for w in train_wave[:100]])
        mean, std = float(sample_feats.mean()), float(sample_feats.std())

        train_ds = AudioDataset(train_wave, train_labels, mean, std, augment=True, seed=fold_idx)
        val_ds = AudioDataset(waveforms[val_mask], labels[val_mask], mean, std, seed=100 + fold_idx)
        test_ds = AudioDataset(waveforms[test_mask], labels[test_mask], mean, std, seed=200 + fold_idx)

        class_counts = np.bincount(train_labels, minlength=len(LABELS))
        class_weights = torch.tensor(
            class_counts.sum() / (len(LABELS) * class_counts), dtype=torch.float32
        ).to(device)

        model, best_val_acc, _ = train_one_model(
            train_ds, val_ds, class_weights, device, max_epochs=40, patience=8
        )
        y_true, y_pred = evaluate(model, test_ds, device)
        acc = (y_true == y_pred).mean()
        report = classification_report(
            y_true, y_pred, target_names=LABELS, output_dict=True, zero_division=0
        )
        cm = confusion_matrix(y_true, y_pred, labels=list(range(len(LABELS))))
        all_cm += cm

        fold_accuracies.append(acc)
        fold_f1s.append(report["macro avg"]["f1-score"])
        print(
            f"Fold {fold_idx+1}/6 (test actors {test_actors}): "
            f"acc={acc:.3f} macro_f1={report['macro avg']['f1-score']:.3f}"
        )

    mean_acc, std_acc = np.mean(fold_accuracies), np.std(fold_accuracies)
    mean_f1, std_f1 = np.mean(fold_f1s), np.std(fold_f1s)
    print(f"\n6-fold CV: accuracy = {mean_acc:.3f} +/- {std_acc:.3f}")
    print(f"6-fold CV: macro F1  = {mean_f1:.3f} +/- {std_f1:.3f}")
    print("Aggregated confusion matrix (summed across folds):")
    print(all_cm)

    # ---- final production model: train on 20 actors, validate on 4, no held-out test
    # (the CV above is the honest generalization estimate for this model class) ----
    final_val_actors = ACTOR_FOLDS[0]
    final_train_actors = [a for a in range(1, 25) if a not in final_val_actors]
    train_mask = np.isin(actors, final_train_actors)
    val_mask = np.isin(actors, final_val_actors)

    train_wave, train_labels = waveforms[train_mask], labels[train_mask]
    sample_feats = np.stack([extract_features(w) for w in train_wave[:150]])
    mean, std = float(sample_feats.mean()), float(sample_feats.std())

    train_ds = AudioDataset(train_wave, train_labels, mean, std, augment=True, seed=999)
    val_ds = AudioDataset(waveforms[val_mask], labels[val_mask], mean, std, seed=1000)

    class_counts = np.bincount(train_labels, minlength=len(LABELS))
    class_weights = torch.tensor(
        class_counts.sum() / (len(LABELS) * class_counts), dtype=torch.float32
    ).to(device)

    final_model, final_val_acc, final_state = train_one_model(
        train_ds, val_ds, class_weights, device, max_epochs=80, patience=15
    )
    print(f"\nFinal production model val_acc={final_val_acc:.3f} (trained on 20 actors)")

    torch.save(
        {"state_dict": final_state, "mean": mean, "std": std},
        os.path.join(MODELS_DIR, "audio_cnn.pt"),
    )
    with open(os.path.join(MODELS_DIR, "audio_cnn_metrics.json"), "w") as f:
        json.dump(
            {
                "cv_mean_accuracy": mean_acc,
                "cv_std_accuracy": std_acc,
                "cv_mean_macro_f1": mean_f1,
                "cv_std_macro_f1": std_f1,
                "cv_fold_accuracies": fold_accuracies,
                "cv_fold_macro_f1s": fold_f1s,
                "cv_aggregated_confusion_matrix": all_cm.tolist(),
                "final_model_val_accuracy": final_val_acc,
                "labels": LABELS,
                "note": "cv_* metrics are the honest generalization estimate (6-fold, "
                "actor-disjoint). final_model_val_accuracy is the deployed model's "
                "validation accuracy, not a held-out test score.",
            },
            f,
            indent=2,
        )

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns

        plt.figure(figsize=(5, 4))
        sns.heatmap(
            all_cm, annot=True, fmt="d", xticklabels=LABELS, yticklabels=LABELS, cmap="Blues"
        )
        plt.xlabel("Predicted")
        plt.ylabel("True")
        plt.title(f"Audio CNN — 6-fold CV confusion matrix (acc={mean_acc:.2f}±{std_acc:.2f})")
        plt.tight_layout()
        plt.savefig(os.path.join(MODELS_DIR, "audio_cnn_confusion_matrix.png"), dpi=150)
        print("Saved confusion matrix plot")
    except ImportError:
        pass

    print(f"\nSaved final model + CV metrics to {MODELS_DIR}")


if __name__ == "__main__":
    main()
