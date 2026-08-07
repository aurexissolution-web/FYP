# EmoBuddy — Handoff Document

Written for whichever agent (Devin or otherwise) picks this project up next. This captures decisions and context that aren't recoverable just by reading the code — read this before making changes.

## What this project is

FYP: EmoBuddy, a bilingual (English/Malay) mental health check-in app. Flutter frontend, FastAPI ML backend, Supabase for auth + persistence. Users type or record a voice check-in; a text model + audio model independently classify mood (happy/sad/angry/neutral), the results are fused, and the app returns a response message, a 3-day self-care plan, and (if a crisis phrase is detected) hotline info — all in the user's chosen language.

**Deadline: Aug 15, 2026.** Today's actual work session ran Jul 31 – Aug 1.

## Repo layout

```
emobuddy/
├── app/            Flutter app
├── ml-service/     FastAPI ML backend (text + audio models, fusion, crisis detection, bilingual content)
└── supabase/       Postgres migrations
```

**This repo has git initialized but zero commits and no remote.** Before Devin (or anyone) can work on it via a normal PR-based workflow, someone needs to make an initial commit and push it somewhere Devin can reach (GitHub). This wasn't done yet — ask the user whether they want that done first.

---

## CRITICAL BLOCKER — fix this first

The Supabase project URL hardcoded in `app/lib/supabase_config.dart` — `https://grmrpzftxlmnzrilzmva.supabase.co` — returns **NXDOMAIN** from multiple public DNS resolvers (1.1.1.1, 8.8.8.8). The project no longer exists, most likely auto-deleted after a long pause on the free tier. `supabase.co` itself resolves fine, so this isn't a general network issue, and the anon key's JWT payload internally matches this same project ref (not a copy-paste mismatch) — the project itself is just gone.

**This blocks:** sign-in/sign-up persistence, and all `mood_logs` writes. It does **not** block the ML pipeline (text/audio/fusion/crisis) — that's fully independent and already verified working.

**To unblock:** the user needs to either restore/unpause the existing Supabase project via their dashboard, or create a new one. If a new project is created:
1. Update the URL + anon key in `app/lib/supabase_config.dart`.
2. Re-run `supabase/migrations/0001_init.sql` against it (creates `mood_logs` and `self_care_plans` tables with RLS policies).

As of writing, this is still unresolved — the user was going to check their dashboard.

---

## What's done (verified working)

Everything below was tested live — both via direct API calls to the ml-service and by driving the actual Flutter UI in a browser — not just written and assumed correct.

1. **Full ML pipeline integration.** ml-service (`uvicorn app.main:app --port 8000`) and the Flutter web app (`flutter run -d chrome --dart-define=ML_SERVICE_URL=http://127.0.0.1:8000`) run together correctly. Verified: text-only, audio-only (real RAVDESS clip, decodes and predicts with no crash), combined text+audio, crisis phrases in both EN ("kill myself" etc., see `ml-service/app/crisis.py`) and MS ("bunuh diri" etc.), crisis short-circuit even with audio attached, CORS preflight, zero unhandled tracebacks in the ml-service log across all of this.

2. **Language switcher.** `app/lib/main.dart`'s `_CheckInPageState` has a `String _language = 'en'` field, an `EN`/`MS` `SegmentedButton` in the `AppBar.actions`, wired into `_api.analyze(..., language: _language)`. Verified live: toggling to MS produces a fully Malay `response_message` and self-care plan; toggling back to EN works. **Deliberate scope limit, not a bug:** this is a data parameter only, not full app localization — the Flutter UI's own labels ("How are you feeling right now?", "Your 3-day self-care plan:", etc.) stay English regardless of the toggle. No `flutter_localizations`/`intl` infrastructure exists in this app. Persistence is in-memory only (resets to 'en' on restart) — deliberately not wired to `shared_preferences` (which exists only in `dev_dependencies`, unused for real persistence) since it doesn't bear on the FYP's actual claim (proving the bilingual backend works end-to-end).

3. **Weighted fusion**, replacing a naive placeholder that used to pick the higher-confidence modality but report the flat *average* of both confidences regardless of which one won (a real bug — e.g. audio winning at 0.9 vs text's 0.4 would report 0.65, not 0.9).
   - `ModalityResult` (`ml-service/app/schemas.py`) now has an optional `probs: dict[Emotion, float]` field carrying the full 4-class softmax vector.
   - Both `TextPredictor.predict()` and `AudioPredictor.predict()` (`ml-service/app/inference.py`) populate it.
   - `_late_fusion()` (`ml-service/app/main.py`) now does a **per-class F1-weighted sum of probability vectors**, not a top-1 comparison:
     ```python
     _TEXT_F1  = {"happy": 0.780, "sad": 0.500, "angry": 0.520, "neutral": 0.643}
     _AUDIO_F1 = {"happy": 0.513, "sad": 0.389, "angry": 0.673, "neutral": 0.752}
     _TEXT_WEIGHT  = {c: _TEXT_F1[c] / (_TEXT_F1[c] + _AUDIO_F1[c]) for c in _LABELS}
     _AUDIO_WEIGHT = {c: 1.0 - _TEXT_WEIGHT[c] for c in _LABELS}
     fused[c] = normalize(_TEXT_WEIGHT[c] * text_probs[c] + _AUDIO_WEIGHT[c] * audio_probs[c])
     ```
   - **Why these specific numbers:** text F1 comes from `models/text_bigru_metrics.json`'s `test_report` (a genuinely held-out GoEmotions test set). Audio F1 comes from `models/audio_cnn_metrics.json`'s **CV mean** per-class F1 (derived from `cv_aggregated_confusion_matrix`), deliberately **not** `final_model_val_accuracy` — the metrics file's own note says CV is "the honest generalization estimate" while val accuracy was the checkpoint-selection criterion and is optimistic. Don't swap this without a reason; it was a deliberate choice.
   - Tested via `ml-service/scripts/test_fusion.py` (standalone, no pytest dependency — none exists in this project) — 10/10 checks pass.

4. **Eval sanity check** (`ml-service/scripts/run_eval.py`): a 24-case eval (4 text-only, 4 audio-only from RAVDESS actors 1-4, 16-cell text×audio disagreement grid). Result: **all 12 disagreement cells were "explainable"** by the fusion weights (fused winner always matched the higher weight×confidence product) — confirms the fusion arithmetic itself has no bugs. The handful of misses that did show up trace to individual-model misclassification on a couple of unluckily-picked test sentences (the eval picks the *first* occurrence of each class in the GoEmotions test set, and one of those is a genuinely garbled row — "It's wonderful because it's awful. At not with." — not representative). **Do not read this as a model regression** — nothing about the trained models changed; this is expected variance on a tiny, non-random 4-per-class sample against known ~66%/~58% accuracy ceilings. Per the eval's own stopping rule: only adjust weights if a *systematic* pattern contradicts them, and none was found — current weights are correct as-is.

### Known secondary issue (not yet fixed, low priority)
When the Supabase mood-log write fails (currently: always, due to the blocker above), `_CheckInPageState._submit()` in `app/lib/main.dart` catches the exception and renders the raw `AuthRetryableFetchException(...)` string directly under the (correctly-rendered) analysis result. This is poor UX regardless of the Supabase outage — worth wrapping `_moodLogService.logResult()` in its own try/catch that fails silently or shows a friendlier message, so a persistence hiccup doesn't look like the whole analysis failed. Not fixed yet because it was lower priority than the core pipeline work.

---

## What's NOT done — remaining phases from the original 15-day plan

The original plan (targeting Aug 15) had 5 phases; only Phase 1 is complete.

**Phase 2 — Mood history screen.** Blocked on the Supabase fix above (needs real `mood_logs` data to build/test against). Scope: a list view of past check-ins queried from `mood_logs`, a basic trend visualization, and wiring up `self_care_plans` completion tracking (that table exists in the schema — `supabase/migrations/0001_init.sql` — but **nothing in the codebase writes to it today**; it's a dead table currently).

**Phase 3 — Deployment.** ml-service → Render (README already references this as the intended target, comment in `main.py` mentions it, but no `render.yaml`/`Dockerfile`/`Procfile` exists yet). Flutter web → Vercel or similar, pointed at the deployed Render URL via `--dart-define=ML_SERVICE_URL=...`. Not started.

**Phase 4 — Testing & hardening.** No `pytest` in the ml-service venv, no `tests/` directory anywhere in the project — only the two standalone scripts mentioned above and the Flutter default `test/widget_test.dart` (untouched boilerplate). Real test coverage for crisis detection, self-care plan generation, and the check-in UI flow doesn't exist yet.

**Phase 5 — Buffer / demo prep.** Not started. Also: full Xcode isn't installed on the dev machine (only Command Line Tools), so iOS builds/simulator are untested — CocoaPods was installed via Homebrew in preparation, but the Xcode install itself needs the user's interactive App Store sign-in and hasn't happened.

---

## How to run everything locally

```bash
# Terminal 1 — ml-service
cd emobuddy/ml-service
.venv/bin/uvicorn app.main:app --reload --port 8000
curl http://127.0.0.1:8000/health   # expect {"status":"ok"}

# Terminal 2 — Flutter app
cd emobuddy/app
flutter pub get
flutter run -d chrome --dart-define=ML_SERVICE_URL=http://127.0.0.1:8000
```

The Flutter app's `AnalyzeApi` default base URL is `http://127.0.0.1:8123` (see `app/lib/services/analyze_api.dart`) — doesn't match the ml-service README's documented port 8000. Left as-is deliberately (see plan file below for reasoning); always launch with the `--dart-define` override rather than changing the default.

Quick manual checks against the ml-service directly (no Flutter needed):
```bash
curl -s -X POST http://127.0.0.1:8000/analyze -H "Content-Type: application/json" \
  -d '{"text": "I got a promotion today!", "language": "en"}' | python3 -m json.tool
```

Fusion sanity tests: `cd ml-service && .venv/bin/python scripts/test_fusion.py`
Eval harness: `cd ml-service && .venv/bin/python scripts/run_eval.py`

---

## Reference

- Full Phase-1 implementation plan (exact rationale for every Day 1-4 decision): `/Users/sanjaygunabalan2626gmail.com/.claude/plans/peaceful-dreaming-squirrel.md` on this machine — worth copying into the repo if handing off to a different environment, since it won't travel with the code otherwise.
- Model metrics: `ml-service/models/text_bigru_metrics.json`, `ml-service/models/audio_cnn_metrics.json`.
- Training/preprocessing scripts (offline, not run at request time): `ml-service/notebooks/`.
