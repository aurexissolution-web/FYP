"""Preprocess RAVDESS speech clips into fixed-length waveforms for the CNN.

Raw waveforms (not pre-extracted MFCC) are saved so that training can apply
real waveform-level augmentation (pitch shift, time stretch, noise) before
feature extraction -- this matters a lot on a dataset this small (864 usable
clips), since it's the main lever for actually diversifying what the model
sees beyond 24 speakers.

RAVDESS filename convention: 03-01-EE-II-SS-RR-AA.wav
  EE = emotion code: 01 neutral, 02 calm, 03 happy, 04 sad, 05 angry,
       06 fearful, 07 disgust, 08 surprised

Mapping to the shared 4-class set (documented as a stated methodological
choice, not hidden): neutral+calm -> neutral, happy -> happy, sad -> sad,
angry -> angry. fearful/disgust/surprised are dropped -- there is no clean
1:1 mapping onto Happy/Sad/Angry/Neutral and forcing them in would introduce
label noise.
"""

import glob
import os

import librosa
import numpy as np

from common import LABEL_TO_IDX, PROCESSED_DIR, RAVDESS_DIR

_EMOTION_CODE_TO_LABEL = {
    "01": "neutral",
    "02": "neutral",
    "03": "happy",
    "04": "sad",
    "05": "angry",
}

SAMPLE_RATE = 22050
CLIP_SECONDS = 3.5
CLIP_LENGTH = int(SAMPLE_RATE * CLIP_SECONDS)


def load_fixed_length(path: str) -> np.ndarray:
    signal, _ = librosa.load(path, sr=SAMPLE_RATE)
    if len(signal) < CLIP_LENGTH:
        signal = np.pad(signal, (0, CLIP_LENGTH - len(signal)), mode="constant")
    else:
        signal = signal[:CLIP_LENGTH]
    return signal.astype(np.float32)


def main() -> None:
    wav_paths = sorted(glob.glob(os.path.join(RAVDESS_DIR, "Actor_*", "*.wav")))
    print(f"Found {len(wav_paths)} RAVDESS clips")

    waveforms = []
    labels = []
    actors = []
    skipped = 0

    for path in wav_paths:
        filename = os.path.basename(path)
        parts = filename.replace(".wav", "").split("-")
        emotion_code = parts[2]
        actor_id = int(parts[6])

        label = _EMOTION_CODE_TO_LABEL.get(emotion_code)
        if label is None:
            skipped += 1
            continue

        waveforms.append(load_fixed_length(path))
        labels.append(LABEL_TO_IDX[label])
        actors.append(actor_id)

    waveforms = np.stack(waveforms)
    labels = np.array(labels, dtype=np.int64)
    actors = np.array(actors, dtype=np.int64)

    print(f"Kept {len(labels)} clips, skipped {skipped} (fearful/disgust/surprised)")
    print(f"Waveform shape: {waveforms.shape}")
    for label, idx in LABEL_TO_IDX.items():
        print(f"  {label}: {(labels == idx).sum()}")

    out_path = os.path.join(PROCESSED_DIR, "audio_waveforms.npz")
    np.savez_compressed(out_path, waveforms=waveforms, labels=labels, actors=actors)
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()
