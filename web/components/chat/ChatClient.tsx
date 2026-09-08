"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import type { AnalyzeResponse } from "@/lib/chat/types";

type Bubble =
  | { kind: "text"; from: "user" | "ai"; text: string }
  | { kind: "plan"; result: AnalyzeResponse };

export function ChatClient({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["chat"];
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { kind: "text", from: "ai", text: dict.greeting },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    setBusy(true);
    setNotice(null);
    setBubbles((b) => [...b, { kind: "text", from: "user", text: message }]);

    try {
      const response = await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message, language: lang }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const data = await response.json();
      setSessionId(data.sessionId);
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: data.reply }]);
      if (data.persisted === false) setNotice(dict.notSaved);
    } catch {
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: dict.errorReply }]);
    } finally {
      setBusy(false);
    }
  }

  async function getPlan() {
    if (!sessionId || busy) return;
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, language: lang }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const result: AnalyzeResponse & { persisted: boolean } = await response.json();
      setBubbles((b) => [
        ...b,
        { kind: "text", from: "ai", text: result.response_message },
        { kind: "plan", result },
      ]);
      if (result.persisted === false) setNotice(dict.notSaved);
    } catch {
      setBubbles((b) => [...b, { kind: "text", from: "ai", text: dict.errorPlan }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>{dict.title}</h1>

      <ul>
        {bubbles.map((bubble, i) =>
          bubble.kind === "text" ? (
            <li key={i} data-from={bubble.from}>
              <strong>{bubble.from === "user" ? dict.youLabel : dict.aiLabel}:</strong>{" "}
              {bubble.text}
            </li>
          ) : (
            <li key={i}>
              {bubble.result.crisis ? (
                <div>
                  <p>{dict.crisisNotice}</p>
                  <ul>
                    {bubble.result.hotlines.map((h) => (
                      <li key={h.phone}>
                        {h.name} — {h.phone} — {h.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p>{dict.planTitle}</p>
                  <ol>
                    {bubble.result.self_care_plan.map((item) => (
                      <li key={item.day}>
                        {dict.dayLabel} {item.day}: {item.activity}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          ),
        )}
        {busy && <li>{dict.thinking}</li>}
      </ul>

      {notice && <p role="status">{notice}</p>}

      <form onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={dict.inputPlaceholder}
          aria-label={dict.inputPlaceholder}
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {dict.send}
        </button>
      </form>

      <button type="button" onClick={getPlan} disabled={!sessionId || busy}>
        {dict.getPlan}
      </button>

      <form action={`/auth/signout?lang=${lang}`} method="post">
        <button type="submit">{dict.signOut}</button>
      </form>
    </div>
  );
}
