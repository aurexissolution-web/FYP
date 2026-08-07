# EmoBuddy ML Service

FastAPI service exposing emotion analysis for the EmoBuddy app and web dashboard.

## Status (Week 1)

`analyze_text` / `analyze_audio` in `app/main.py` are **mocked placeholders** for the
trained Bi-GRU (text) and CNN (audio) models. Crisis detection and the self-care
template engine (`app/crisis.py`, `app/selfcare.py`) are real, not mocked — they're
rule-based and don't depend on trained models.

Real models get trained in `notebooks/` (Week 2) against RAVDESS (audio) and
`dair-ai/emotion` (text), exported to `models/`, and wired into `main.py` in Week 3.

## Run locally

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health`
- `POST /analyze/text` — `{ text }` -> `{ label, confidence }`
- `POST /analyze/audio` — `{ audio_base64 }` -> `{ label, confidence }`
- `POST /analyze` — `{ text?, audio_base64?, language }` -> fused result + self-care plan,
  or `{ crisis: true }` with an empty plan if crisis keywords are detected.

## Deployment

Deployed to Render's free tier in Week 3 so the Vercel-hosted web dashboard and the
Flutter APK can both reach it over a public URL.
