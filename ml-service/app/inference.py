import base64
import binascii
import io
import json
import os
import re

import librosa
import numpy as np
import torch

from .emotion_models import AudioCNN, BiGRUClassifier
from .schemas import ModalityResult

# These models are tiny and inference is single-request; torch's default thread
# pool just thrashes on the fractional-vCPU instances this deploys to.
torch.set_num_threads(1)


class AudioDecodeError(ValueError):
    """Raised when the provided audio clip can't be decoded/featurized."""

_MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

_LABELS = ["happy", "sad", "angry", "neutral"]

# Must match ml-service/notebooks/audio_features.py
_SAMPLE_RATE = 22050
_CLIP_LENGTH = int(_SAMPLE_RATE * 3.5)
_N_MFCC = 40
_HOP_LENGTH = 512
_N_FRAMES = 1 + _CLIP_LENGTH // _HOP_LENGTH

# Must match ml-service/notebooks/preprocess_text.py
_TOKEN_RE = re.compile(r"[a-z']+")


def _device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


class TextPredictor:
    def __init__(self):
        vocab_path = os.path.join(_MODELS_DIR, "text_vocab.json")
        model_path = os.path.join(_MODELS_DIR, "text_bigru.pt")
        with open(vocab_path) as f:
            vocab_meta = json.load(f)
        self.word_to_idx = {word: i for i, word in enumerate(vocab_meta["vocab"])}
        self.pad_idx = vocab_meta["pad_idx"]
        self.unk_idx = vocab_meta["unk_idx"]
        self.max_seq_len = vocab_meta["max_seq_len"]

        self.device = _device()
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model = BiGRUClassifier(
            vocab_size=checkpoint["vocab_size"],
            pad_idx=checkpoint["pad_idx"],
            num_classes=len(_LABELS),
        ).to(self.device)
        self.model.load_state_dict(checkpoint["state_dict"])
        self.model.eval()

    def _encode(self, text: str) -> torch.Tensor:
        tokens = _TOKEN_RE.findall(text.lower())
        ids = [self.word_to_idx.get(t, self.unk_idx) for t in tokens[: self.max_seq_len]]
        ids += [self.pad_idx] * (self.max_seq_len - len(ids))
        return torch.tensor([ids], dtype=torch.long)

    def predict(self, text: str) -> ModalityResult:
        with torch.no_grad():
            x = self._encode(text).to(self.device)
            probs = torch.softmax(self.model(x), dim=1)[0]
            idx = int(torch.argmax(probs).item())
        probs_dict = {label: round(float(p), 3) for label, p in zip(_LABELS, probs)}
        return ModalityResult(label=_LABELS[idx], confidence=probs_dict[_LABELS[idx]], probs=probs_dict)


class AudioPredictor:
    def __init__(self):
        model_path = os.path.join(_MODELS_DIR, "audio_cnn.pt")
        self.device = _device()
        checkpoint = torch.load(model_path, map_location=self.device)
        self.mean = checkpoint["mean"]
        self.std = checkpoint["std"]
        self.model = AudioCNN(num_classes=len(_LABELS)).to(self.device)
        self.model.load_state_dict(checkpoint["state_dict"])
        self.model.eval()

    def _extract_features(self, audio_bytes: bytes) -> np.ndarray:
        """Returns (3, N_MFCC, N_FRAMES): MFCC, delta, delta2 as channels --
        must match ml-service/notebooks/audio_features.py's extract_features."""
        signal, _ = librosa.load(io.BytesIO(audio_bytes), sr=_SAMPLE_RATE)
        if len(signal) < _CLIP_LENGTH:
            signal = np.pad(signal, (0, _CLIP_LENGTH - len(signal)), mode="constant")
        else:
            signal = signal[:_CLIP_LENGTH]

        mfcc = librosa.feature.mfcc(
            y=signal, sr=_SAMPLE_RATE, n_mfcc=_N_MFCC, hop_length=_HOP_LENGTH
        )
        if mfcc.shape[1] < _N_FRAMES:
            mfcc = np.pad(mfcc, ((0, 0), (0, _N_FRAMES - mfcc.shape[1])), mode="constant")
        else:
            mfcc = mfcc[:, :_N_FRAMES]
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        return np.stack([mfcc, delta, delta2]).astype(np.float32)

    def predict(self, audio_base64: str) -> ModalityResult:
        try:
            audio_bytes = base64.b64decode(audio_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise AudioDecodeError(f"audio_base64 is not valid base64: {exc}") from exc

        try:
            features = self._extract_features(audio_bytes)
        except Exception as exc:  # noqa: BLE001 - convert any decode failure into a clean error
            raise AudioDecodeError(f"Could not decode the audio clip: {exc}") from exc
        features = (features - self.mean) / self.std
        with torch.no_grad():
            x = torch.from_numpy(features).unsqueeze(0).float().to(self.device)
            probs = torch.softmax(self.model(x), dim=1)[0]
            idx = int(torch.argmax(probs).item())
        probs_dict = {label: round(float(p), 3) for label, p in zip(_LABELS, probs)}
        return ModalityResult(label=_LABELS[idx], confidence=probs_dict[_LABELS[idx]], probs=probs_dict)
