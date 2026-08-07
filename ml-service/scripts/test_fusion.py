"""Standalone sanity checks for app.main._late_fusion. No pytest dependency --
run directly: cd ml-service && .venv/bin/python scripts/test_fusion.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import _late_fusion
from app.schemas import ModalityResult

_LABELS = ["happy", "sad", "angry", "neutral"]


def _result(label: str, confidence: float) -> ModalityResult:
    # Puts all remaining probability mass on "neutral" (or "happy" if the
    # winning label already is neutral) just to give every case a full,
    # valid probability vector without hand-crafting one per test.
    other = "neutral" if label != "neutral" else "happy"
    probs = {c: 0.0 for c in _LABELS}
    probs[label] = confidence
    probs[other] = round(1.0 - confidence, 3)
    return ModalityResult(label=label, confidence=confidence, probs=probs)


def check(name: str, condition: bool):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {name}")
    if not condition:
        global failures
        failures += 1


failures = 0

# 1. Text wins on confidence -- fused confidence should NOT be the flat mean.
text = _result("happy", 0.9)
audio = _result("angry", 0.3)
fused = _late_fusion(text, audio)
flat_mean = round((0.9 + 0.3) / 2, 3)
check("text-wins case: label is happy", fused.label == "happy")
check("text-wins case: confidence is not the flat mean", fused.confidence != flat_mean)
print(f"    -> fused={fused.label}@{fused.confidence} (flat mean would have been {flat_mean})")

# 2. Audio wins on confidence -- the exact bug-report scenario.
text = _result("happy", 0.4)
audio = _result("angry", 0.9)
fused = _late_fusion(text, audio)
flat_mean = round((0.4 + 0.9) / 2, 3)
check("audio-wins case (bug report): confidence is not the flat 0.65 mean", fused.confidence != flat_mean)
print(f"    -> fused={fused.label}@{fused.confidence} (flat mean would have been {flat_mean})")

# 3. Single-modality passthrough (text only).
text = _result("sad", 0.7)
fused = _late_fusion(text, None)
check("text-only passthrough: label matches", fused.label == "sad")
check("text-only passthrough: confidence matches", fused.confidence == 0.7)

# 4. Single-modality passthrough (audio only).
audio = _result("neutral", 0.55)
fused = _late_fusion(None, audio)
check("audio-only passthrough: label matches", fused.label == "neutral")
check("audio-only passthrough: confidence matches", fused.confidence == 0.55)

# 5. Every "both" case should renormalize to sum ~= 1.0.
cases = [
    (_result("happy", 0.9), _result("angry", 0.3)),
    (_result("sad", 0.6), _result("sad", 0.6)),
    (_result("angry", 0.5), _result("neutral", 0.5)),
]
for i, (t, a) in enumerate(cases):
    fused = _late_fusion(t, a)
    total = sum(fused.probs.values())
    check(f"case {i}: fused probs sum to ~1.0 (got {total:.4f})", abs(total - 1.0) < 1e-6)

print()
if failures:
    print(f"{failures} check(s) FAILED")
    sys.exit(1)
print("All checks passed.")
