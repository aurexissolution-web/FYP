"""Waveform augmentation + MFCC(+delta+delta2) feature extraction for the
audio CNN. Kept as one module so training and inference stay in sync.
"""

import librosa
import numpy as np

SAMPLE_RATE = 22050
CLIP_LENGTH = int(SAMPLE_RATE * 3.5)
N_MFCC = 40
HOP_LENGTH = 512
N_FRAMES = 1 + CLIP_LENGTH // HOP_LENGTH  # librosa's default frame count


def _fix_length(signal: np.ndarray) -> np.ndarray:
    if len(signal) < CLIP_LENGTH:
        return np.pad(signal, (0, CLIP_LENGTH - len(signal)), mode="constant")
    return signal[:CLIP_LENGTH]


def augment_waveform(signal: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Randomly pitch-shift, time-stretch, and add noise. Applied only to
    training data -- this is the main lever for diversifying a 648-clip
    training set beyond its 18 source speakers."""
    out = signal
    if rng.random() < 0.5:
        semitones = rng.uniform(-2.0, 2.0)
        out = librosa.effects.pitch_shift(out, sr=SAMPLE_RATE, n_steps=semitones)
    if rng.random() < 0.5:
        rate = rng.uniform(0.85, 1.15)
        out = librosa.effects.time_stretch(out, rate=rate)
    out = _fix_length(out)
    if rng.random() < 0.5:
        noise_level = rng.uniform(0.001, 0.006)
        out = out + rng.normal(0, noise_level, size=out.shape).astype(np.float32)
    return out.astype(np.float32)


def extract_features(signal: np.ndarray) -> np.ndarray:
    """Returns (3, N_MFCC, N_FRAMES): MFCC, delta, delta-delta as channels."""
    signal = _fix_length(signal)
    mfcc = librosa.feature.mfcc(y=signal, sr=SAMPLE_RATE, n_mfcc=N_MFCC, hop_length=HOP_LENGTH)
    if mfcc.shape[1] < N_FRAMES:
        mfcc = np.pad(mfcc, ((0, 0), (0, N_FRAMES - mfcc.shape[1])), mode="constant")
    else:
        mfcc = mfcc[:, :N_FRAMES]
    delta = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)
    return np.stack([mfcc, delta, delta2]).astype(np.float32)


def spec_augment(
    features: np.ndarray, rng: np.random.Generator, max_time_mask=20, max_freq_mask=8
) -> np.ndarray:
    """Time + frequency masking applied identically across all channels
    (they share the same time/coefficient axes)."""
    features = features.copy()
    t_width = rng.integers(0, max_time_mask + 1)
    if t_width > 0:
        start = rng.integers(0, features.shape[2] - t_width + 1)
        features[:, :, start : start + t_width] = 0.0
    f_width = rng.integers(0, max_freq_mask + 1)
    if f_width > 0:
        start = rng.integers(0, features.shape[1] - f_width + 1)
        features[:, start : start + f_width, :] = 0.0
    return features
