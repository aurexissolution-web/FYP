# EmoBuddy — Agent/Dev Notes

## Running the app against the ml-service on a physical device

The Flutter app talks to the FastAPI ml-service via `kMlServiceBaseUrl` in
`app/lib/services/analyze_api.dart`, which **defaults to
`http://127.0.0.1:8123`**. That address only resolves to "localhost" of
whatever device the app itself is running on:

- Works out of the box on: Chrome (desktop), iOS Simulator, Android Emulator
  (with the emulator's special-cased `10.0.2.2` alias) — anything running on
  the same machine as the ml-service.
- **Does NOT work** on a real iPhone/Android phone — `127.0.0.1` there means
  the phone itself, so every API call silently fails to connect. This is why
  voice check-ins show a connection error and, previously, why chat replies
  looked broken (text has a local canned fallback that partially masked
  the failure).

To test on a physical device, point the app at somewhere the phone can
actually reach:

- **Same WiFi as your Mac:** run
  `flutter run -d <device> --dart-define=ML_SERVICE_URL=http://<mac-lan-ip>:8123`
  (find your Mac's LAN IP with `ipconfig getifaddr en0`).
- **Different network (e.g. testing over cellular/4G):** a LAN IP won't be
  reachable. Tunnel the local ml-service instead, e.g.
  `ngrok http 8123`, then run
  `flutter run -d <device> --dart-define=ML_SERVICE_URL=https://<tunnel-id>.ngrok-free.app`.
- **Deployed backend:** once ml-service is deployed (see `HANDOFF.md`), just
  point `ML_SERVICE_URL` at the deployed URL.

## Chat history / session persistence

The app now stores a full message thread for every check-in session. The
migration lives in `supabase/migrations/0003_chat_messages.sql`. Before
testing on a device, apply it to the active Supabase project:

- Local Supabase: `supabase db reset` (applies all migrations) or run the
  migration SQL in the local studio.
- Hosted Supabase: use `supabase db push` if the CLI is linked, or open
  the SQL editor and paste the contents of `0003_chat_messages.sql`.

After applying, the History tab lists past chat sessions and tapping a
session loads it back into the Chat tab. The Plan tab remains the home
for the current and previous 3-day self-care plans.

## ml-service

- Run locally: `uvicorn app.main:app --port 8123` (from `ml-service/`, with
  `.venv` activated).
- `/analyze`, `/analyze/audio`, and `/analyze/conversation` return a clean
  `422` (not a raw `500`) when the provided `audio_base64` can't be decoded
  or featurized — see `AudioDecodeError` in `app/inference.py`.
