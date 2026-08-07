import os

LABELS = ["happy", "sad", "angry", "neutral"]
LABEL_TO_IDX = {label: i for i, label in enumerate(LABELS)}

NOTEBOOKS_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SERVICE_DIR = os.path.dirname(NOTEBOOKS_DIR)
DATASETS_DIR = os.path.join(ML_SERVICE_DIR, "datasets")
PROCESSED_DIR = os.path.join(DATASETS_DIR, "processed")
RAVDESS_DIR = os.path.join(DATASETS_DIR, "ravdess")
MODELS_DIR = os.path.join(ML_SERVICE_DIR, "models")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)


def get_device():
    import torch

    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")
