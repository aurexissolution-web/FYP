"""Preprocess GoEmotions into the shared 4-class set for the Bi-GRU.

GoEmotions is multi-label (27 emotions + neutral) over Reddit comments. We
bucket its labels by valence/arousal into Happy/Sad/Angry/Neutral. An example
is kept only if *all* of its GoEmotions labels fall into the same bucket --
this avoids feeding the model contradictory signals (e.g. a comment labelled
both "joy" and "anger"). Examples whose labels don't map to any bucket
(confusion, curiosity, desire, fear, nervousness, realization, surprise) are
dropped, as is any example with no bucket-eligible labels at all.
"""

import json
import os
import re
from collections import Counter

import numpy as np
from datasets import load_dataset

from common import LABEL_TO_IDX, PROCESSED_DIR

_BUCKETS = {
    "happy": {
        "admiration", "amusement", "approval", "caring", "excitement",
        "gratitude", "joy", "love", "optimism", "pride", "relief",
    },
    "sad": {"disappointment", "embarrassment", "grief", "remorse", "sadness"},
    "angry": {"anger", "annoyance", "disapproval", "disgust"},
    "neutral": {"neutral"},
}
_LABEL_TO_BUCKET = {
    label: bucket for bucket, labels in _BUCKETS.items() for label in labels
}

MAX_VOCAB_SIZE = 20000
MAX_SEQ_LEN = 40
PAD_TOKEN = "<pad>"
UNK_TOKEN = "<unk>"

_TOKEN_RE = re.compile(r"[a-z']+")


def tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def bucket_for_example(label_ids: list[int], names: list[str]) -> str | None:
    buckets = {_LABEL_TO_BUCKET[names[i]] for i in label_ids if names[i] in _LABEL_TO_BUCKET}
    if len(buckets) != 1:
        return None
    return next(iter(buckets))


def main() -> None:
    ds = load_dataset("google-research-datasets/go_emotions", "simplified")
    label_names = ds["train"].features["labels"].feature.names

    split_examples: dict[str, list[tuple[list[str], str]]] = {}
    for split in ("train", "validation", "test"):
        kept = []
        for row in ds[split]:
            bucket = bucket_for_example(row["labels"], label_names)
            if bucket is None:
                continue
            tokens = tokenize(row["text"])
            if not tokens:
                continue
            kept.append((tokens, bucket))
        split_examples[split] = kept
        print(f"{split}: kept {len(kept)} / {len(ds[split])}")
        print(f"  {Counter(b for _, b in kept)}")

    vocab_counter = Counter()
    for tokens, _ in split_examples["train"]:
        vocab_counter.update(tokens)
    vocab = [PAD_TOKEN, UNK_TOKEN] + [
        word for word, _ in vocab_counter.most_common(MAX_VOCAB_SIZE - 2)
    ]
    word_to_idx = {word: i for i, word in enumerate(vocab)}
    unk_idx = word_to_idx[UNK_TOKEN]
    pad_idx = word_to_idx[PAD_TOKEN]

    def encode(tokens: list[str]) -> list[int]:
        ids = [word_to_idx.get(t, unk_idx) for t in tokens[:MAX_SEQ_LEN]]
        ids += [pad_idx] * (MAX_SEQ_LEN - len(ids))
        return ids

    for split, examples in split_examples.items():
        sequences = np.array([encode(tokens) for tokens, _ in examples], dtype=np.int64)
        labels = np.array(
            [LABEL_TO_IDX[bucket] for _, bucket in examples], dtype=np.int64
        )
        out_path = os.path.join(PROCESSED_DIR, f"text_{split}.npz")
        np.savez_compressed(out_path, sequences=sequences, labels=labels)
        print(f"Saved {out_path}: {sequences.shape}")

    vocab_path = os.path.join(PROCESSED_DIR, "text_vocab.json")
    with open(vocab_path, "w") as f:
        json.dump(
            {"vocab": vocab, "pad_idx": pad_idx, "unk_idx": unk_idx, "max_seq_len": MAX_SEQ_LEN},
            f,
        )
    print(f"Saved vocab ({len(vocab)} tokens) to {vocab_path}")


if __name__ == "__main__":
    main()
