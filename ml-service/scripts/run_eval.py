"""Day 4 sanity-check eval for the fusion pipeline.

IMPORTANT CAVEAT: text (GoEmotions) and audio (RAVDESS) are unrelated source
datasets -- there is no naturally-paired real-world "same moment, both
modalities" ground truth. Every "both" case below is a *synthetic pairing*
constructed to exercise the fusion arithmetic under a known combination of
per-modality true labels. This is NOT a measurement of real multimodal
accuracy -- it's a check that the fusion weights behave sensibly.

Run: cd ml-service && .venv/bin/python scripts/run_eval.py
"""
import base64
import os
import re
import sys
from pathlib import Path

os.environ.setdefault("HF_HUB_OFFLINE", "1")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np

from app.main import _AUDIO_WEIGHT, _TEXT_WEIGHT, _late_fusion, _audio_predictor, _text_predictor

_LABELS = ["happy", "sad", "angry", "neutral"]
_ML_SERVICE_DIR = Path(__file__).resolve().parent.parent
_RAVDESS_DIR = _ML_SERVICE_DIR / "datasets" / "ravdess"
_PROCESSED_DIR = _ML_SERVICE_DIR / "datasets" / "processed"

# Same bucketing as notebooks/preprocess_text.py -- required to recover the
# raw sentence behind each tokenized row in text_test.npz.
_BUCKETS = {
    "happy": {
        "admiration", "amusement", "approval", "caring", "excitement",
        "gratitude", "joy", "love", "optimism", "pride", "relief",
    },
    "sad": {"disappointment", "embarrassment", "grief", "remorse", "sadness"},
    "angry": {"anger", "annoyance", "disapproval", "disgust"},
    "neutral": {"neutral"},
}
_LABEL_TO_BUCKET = {label: bucket for bucket, labels in _BUCKETS.items() for label in labels}
_TOKEN_RE = re.compile(r"[a-z']+")

# Same RAVDESS emotion-code remap as notebooks/preprocess_audio.py.
_RAVDESS_CODE_TO_LABEL = {"01": "neutral", "02": "neutral", "03": "happy", "04": "sad", "05": "angry"}


def _bucket_for_example(label_ids, names):
    buckets = {_LABEL_TO_BUCKET[names[i]] for i in label_ids if names[i] in _LABEL_TO_BUCKET}
    if len(buckets) != 1:
        return None
    return next(iter(buckets))


def recover_one_text_sentence_per_class():
    """Replays preprocess_text.py's exact test-split filter (deterministic,
    order-preserving) to recover the raw sentence behind the first
    text_test.npz row of each class, then cross-checks against the saved
    labels to confirm index alignment before trusting it."""
    from datasets import load_dataset

    npz = np.load(_PROCESSED_DIR / "text_test.npz")
    saved_labels = npz["labels"]

    ds = load_dataset("google-research-datasets/go_emotions", "simplified")
    label_names = ds["train"].features["labels"].feature.names

    kept = []
    for row in ds["test"]:
        bucket = _bucket_for_example(row["labels"], label_names)
        if bucket is None:
            continue
        if not _TOKEN_RE.findall(row["text"].lower()):
            continue
        kept.append((row["text"], bucket))

    assert len(kept) == len(saved_labels), (
        f"Recovery mismatch: recovered {len(kept)} rows, text_test.npz has {len(saved_labels)}"
    )

    picked = {}
    for i, (text, bucket) in enumerate(kept):
        assert _LABELS[saved_labels[i]] == bucket, f"index {i}: bucket {bucket} != saved label {_LABELS[saved_labels[i]]}"
        if bucket not in picked:
            picked[bucket] = text
        if len(picked) == 4:
            break
    return picked


def ravdess_clip_for(actor_id: int, label: str) -> Path:
    actor_dir = _RAVDESS_DIR / f"Actor_{actor_id:02d}"
    for wav_path in sorted(actor_dir.glob("*.wav")):
        parts = wav_path.stem.split("-")
        code = parts[2]
        if _RAVDESS_CODE_TO_LABEL.get(code) == label:
            return wav_path
    raise RuntimeError(f"No RAVDESS clip found for actor {actor_id}, label {label}")


def audio_b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


def main():
    print("Recovering one held-out GoEmotions test sentence per class...")
    text_by_label = recover_one_text_sentence_per_class()
    for label, text in text_by_label.items():
        print(f"  {label}: {text!r}")
    print()

    print(f"Text weights:  {_TEXT_WEIGHT}")
    print(f"Audio weights: {_AUDIO_WEIGHT}")
    print()

    failures = 0

    # --- 4 text-only cases ---
    print("=== Text-only (sanity check vs. known model behavior) ===")
    for label in _LABELS:
        result = _text_predictor.predict(text_by_label[label])
        ok = result.label == label
        failures += 0 if ok else 1
        print(f"  expected={label:8s} got={result.label:8s}@{result.confidence:.3f}  {'OK' if ok else 'MISMATCH (model limitation, not necessarily a bug)'}")
    print()

    # --- 4 audio-only cases (actors 1-4, least-contaminated for the deployed model) ---
    print("=== Audio-only (RAVDESS actors 1-4 -- early-stopping-only exposure, not leakage-free) ===")
    audio_clip_for_label = {}
    for i, label in enumerate(_LABELS):
        actor = i + 1
        path = ravdess_clip_for(actor, label)
        audio_clip_for_label[label] = (actor, path)
        result = _audio_predictor.predict(audio_b64(path))
        ok = result.label == label
        print(f"  expected={label:8s} (actor {actor}) got={result.label:8s}@{result.confidence:.3f}  {'OK' if ok else 'MISMATCH (model limitation, not necessarily a bug)'}")
    print()

    # --- 16 "both" cases: full 4x4 grid of (text true label) x (audio true label) ---
    # Actor for a given audio label rotates by row (text label index) so no
    # single clip is reused across all 4 appearances of that audio label.
    print("=== Both (4x4 grid, text label x audio label) ===")
    print("    Diagonal = modalities agree. Off-diagonal = disagreement -- the")
    print("    interesting cases for checking whether per-class weights make sense.")
    print()
    disagreement_notes = []
    for row_idx, text_label in enumerate(_LABELS):
        actor = row_idx + 1
        text_result = _text_predictor.predict(text_by_label[text_label])
        for audio_label in _LABELS:
            audio_path = ravdess_clip_for(actor, audio_label)
            audio_result = _audio_predictor.predict(audio_b64(audio_path))
            fused = _late_fusion(text_result, audio_result)

            agree = text_label == audio_label
            tag = "AGREE" if agree else "DISAGREE"
            print(
                f"  [{tag:8s}] true=(text:{text_label:7s} audio:{audio_label:7s}, actor{actor})  "
                f"text_pred={text_result.label:8s}@{text_result.confidence:.2f}  "
                f"audio_pred={audio_result.label:8s}@{audio_result.confidence:.2f}  "
                f"-> fused={fused.label:8s}@{fused.confidence:.2f}"
            )

            if agree:
                if fused.label != text_label:
                    failures += 1
                    print(f"      ** unexpected: both true labels agree on {text_label} but fusion picked {fused.label} **")
            else:
                # Explainability check: does the fused winner match whichever
                # side had the larger (weight * predicted-class-probability)
                # product? If not, that's a fusion bug, not a tuning signal.
                text_score = _TEXT_WEIGHT[text_result.label] * text_result.confidence
                audio_score = _AUDIO_WEIGHT[audio_result.label] * audio_result.confidence
                expected_winner = text_result.label if text_score >= audio_score else audio_result.label
                explainable = fused.label == expected_winner
                note = (
                    f"text_true={text_label} audio_true={audio_label}: "
                    f"fused={fused.label} (expected-by-weights={expected_winner}) "
                    f"{'explainable' if explainable else 'NOT EXPLAINABLE -- investigate'}"
                )
                disagreement_notes.append(note)
                if not explainable:
                    failures += 1
    print()

    print("=== Disagreement-cell notes ===")
    for note in disagreement_notes:
        print(f"  - {note}")
    print()

    if failures:
        print(f"{failures} issue(s) flagged above (model-accuracy mismatches on single-modality cases are expected and not counted as script failures unless noted).")
    print("Eval run complete.")


if __name__ == "__main__":
    main()
