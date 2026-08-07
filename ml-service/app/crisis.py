from typing import Optional

CRISIS_KEYWORDS_EN = [
    "kill myself",
    "end my life",
    "want to die",
    "no reason to live",
    "can't go on",
    "cant go on",
    "suicide",
    "self harm",
    "hurt myself",
    "better off dead",
]

CRISIS_KEYWORDS_MS = [
    "nak mati",
    "bunuh diri",
    "tak nak hidup",
    "putus asa",
    "tiada harapan",
    "tak larat hidup",
    "cederakan diri",
]

_ALL_KEYWORDS = CRISIS_KEYWORDS_EN + CRISIS_KEYWORDS_MS


def detect_crisis(text: Optional[str]) -> bool:
    if not text:
        return False
    lowered = text.lower()
    return any(keyword in lowered for keyword in _ALL_KEYWORDS)
