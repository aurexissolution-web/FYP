from typing import TypedDict

from .schemas import Language


class HotlineEntry(TypedDict):
    name: str
    phone: str
    description: str


# Verified current as of 2026-07. Re-check before any real-world (non-demo) use.
_HOTLINES_EN: list[HotlineEntry] = [
    {
        "name": "Talian Kasih",
        "phone": "15999",
        "description": "24-hour national helpline (Ministry of Women, Family and "
        "Community Development). WhatsApp: 019-261 5999.",
    },
    {
        "name": "Talian HEAL",
        "phone": "15555",
        "description": "Ministry of Health 24-hour mental health support line.",
    },
    {
        "name": "Befrienders Kuala Lumpur",
        "phone": "03-7627 2929",
        "description": "24-hour confidential emotional support.",
    },
]

_HOTLINES_MS: list[HotlineEntry] = [
    {
        "name": "Talian Kasih",
        "phone": "15999",
        "description": "Talian bantuan negara 24 jam (Kementerian Pembangunan "
        "Wanita, Keluarga dan Masyarakat). WhatsApp: 019-261 5999.",
    },
    {
        "name": "Talian HEAL",
        "phone": "15555",
        "description": "Talian sokongan kesihatan mental 24 jam, Kementerian "
        "Kesihatan Malaysia.",
    },
    {
        "name": "Befrienders Kuala Lumpur",
        "phone": "03-7627 2929",
        "description": "Sokongan emosi sulit secara sulit, 24 jam.",
    },
]

CRISIS_MESSAGE = {
    "en": (
        "It sounds like you might be going through something very difficult "
        "right now, and I'm really glad you reached out. Please consider "
        "speaking with a psychiatrist or mental health professional as soon "
        "as possible — you deserve real support. Here are people you can "
        "talk to right now:"
    ),
    "ms": (
        "Nampaknya anda mungkin sedang melalui sesuatu yang sangat sukar "
        "sekarang, dan saya gembira anda menghubungi. Sila pertimbangkan "
        "untuk berjumpa dengan pakar psikiatri atau profesional kesihatan "
        "mental secepat mungkin — anda layak mendapat sokongan sebenar. "
        "Berikut ialah pihak yang boleh anda hubungi sekarang:"
    ),
}


def get_hotlines(language: Language) -> list[HotlineEntry]:
    return _HOTLINES_MS if language == "ms" else _HOTLINES_EN


def get_crisis_message(language: Language) -> str:
    return CRISIS_MESSAGE["ms" if language == "ms" else "en"]
