from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .crisis import detect_crisis
from .hotlines import get_crisis_message, get_hotlines
from .inference import AudioPredictor, TextPredictor
from .responses import get_response_message
from .schemas import AnalyzeRequest, AnalyzeResponse, ModalityResult
from .selfcare import generate_plan

app = FastAPI(title="EmoBuddy ML Service")

# The app (Flutter web build) and website (Vercel) are always cross-origin from
# this service (Render), and the API carries no auth/session state itself, so
# allowing all origins is fine here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loaded once at startup: trained Bi-GRU (text, GoEmotions) and CNN (audio,
# RAVDESS) — see ml-service/notebooks for training/evaluation.
_text_predictor = TextPredictor()
_audio_predictor = AudioPredictor()

_LABELS = ["happy", "sad", "angry", "neutral"]

# Per-class F1 on held-out evaluation data, used to weight each modality's
# vote by how reliable it actually is for that specific class (rather than
# a single global confidence comparison). Anchored on the CV mean per-class
# F1 for audio (the "honest generalization estimate" per its metrics note),
# not the deployed checkpoint's own val accuracy, which was the
# checkpoint-selection criterion and is optimistic.
_TEXT_F1 = {"happy": 0.780, "sad": 0.500, "angry": 0.520, "neutral": 0.643}  # text_bigru_metrics.json test_report
_AUDIO_F1 = {"happy": 0.513, "sad": 0.389, "angry": 0.673, "neutral": 0.752}  # audio_cnn_metrics.json CV confusion matrix

_TEXT_WEIGHT = {c: _TEXT_F1[c] / (_TEXT_F1[c] + _AUDIO_F1[c]) for c in _LABELS}
_AUDIO_WEIGHT = {c: 1.0 - _TEXT_WEIGHT[c] for c in _LABELS}


def _late_fusion(
    text_result: ModalityResult | None, audio_result: ModalityResult | None
) -> ModalityResult:
    if text_result and audio_result:
        assert text_result.probs is not None and audio_result.probs is not None
        fused_raw = {
            c: _TEXT_WEIGHT[c] * text_result.probs[c] + _AUDIO_WEIGHT[c] * audio_result.probs[c]
            for c in _LABELS
        }
        total = sum(fused_raw.values())
        fused = {c: round(v / total, 3) for c, v in fused_raw.items()}
        label = max(fused, key=fused.get)
        confidence = round(min(fused[label], 1.0), 3)
        return ModalityResult(label=label, confidence=confidence, probs=fused)
    winner = text_result or audio_result
    assert winner is not None
    return winner


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze/text", response_model=ModalityResult)
def analyze_text(payload: AnalyzeRequest) -> ModalityResult:
    if not payload.text:
        raise HTTPException(400, "text is required")
    return _text_predictor.predict(payload.text)


@app.post("/analyze/audio", response_model=ModalityResult)
def analyze_audio(payload: AnalyzeRequest) -> ModalityResult:
    if not payload.audio_base64:
        raise HTTPException(400, "audio_base64 is required")
    return _audio_predictor.predict(payload.audio_base64)


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    if not payload.text and not payload.audio_base64:
        raise HTTPException(400, "Provide text and/or audio_base64")

    if detect_crisis(payload.text):
        return AnalyzeResponse(
            text_result=None,
            audio_result=None,
            fusion_result=ModalityResult(label="sad", confidence=1.0),
            crisis=True,
            response_message=get_crisis_message(payload.language),
            self_care_plan=[],
            hotlines=get_hotlines(payload.language),
        )

    text_result = _text_predictor.predict(payload.text) if payload.text else None
    audio_result = _audio_predictor.predict(payload.audio_base64) if payload.audio_base64 else None
    fusion_result = _late_fusion(text_result, audio_result)
    plan = generate_plan(fusion_result.label, payload.language)
    response_message = get_response_message(fusion_result.label, payload.language)

    return AnalyzeResponse(
        text_result=text_result,
        audio_result=audio_result,
        fusion_result=fusion_result,
        crisis=False,
        response_message=response_message,
        self_care_plan=plan,
    )
