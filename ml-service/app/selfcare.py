from typing import Iterable

from .schemas import Emotion, Language, SelfCareItem

SELF_CARE_TEMPLATES: dict[Emotion, dict[Language, list[str]]] = {
    "happy": {
        "en": [
            "Write down three things that went well today to reinforce the positive moment.",
            "Share the good news with a friend or family member.",
            "Do a short gratitude journaling exercise before bed.",
        ],
        "ms": [
            "Tulis tiga perkara baik yang berlaku hari ini untuk mengukuhkan perasaan positif.",
            "Kongsikan berita baik ini dengan rakan atau keluarga.",
            "Lakukan jurnal kesyukuran ringkas sebelum tidur.",
        ],
    },
    "sad": {
        "en": [
            "Try a 5-minute guided breathing exercise to ground yourself.",
            "Write a short journal entry about what's weighing on you, without judging it.",
            "Reach out to one person you trust for a short check-in conversation.",
        ],
        "ms": [
            "Cuba latihan pernafasan berpandu selama 5 minit untuk menenangkan diri.",
            "Tulis catatan ringkas tentang apa yang membebankan anda, tanpa menghakimi.",
            "Hubungi seorang yang anda percayai untuk berbual sebentar.",
        ],
    },
    "angry": {
        "en": [
            "Step away for a 10-minute walk before responding to what triggered you.",
            "Try a box-breathing exercise (4s in, 4s hold, 4s out, 4s hold) to lower arousal.",
            "Write down what happened and what you'd want to say, then reread it after an hour.",
        ],
        "ms": [
            "Berjalan kaki selama 10 minit sebelum bertindak balas terhadap punca kemarahan.",
            "Cuba teknik pernafasan kotak (4s tarik, 4s tahan, 4s hembus, 4s tahan).",
            "Tulis apa yang berlaku dan apa yang ingin anda katakan, baca semula selepas sejam.",
        ],
    },
    "neutral": {
        "en": [
            "Do a quick body scan to notice any tension you might be holding.",
            "Take a short digital detox break — 15 minutes away from your phone.",
            "Log how you're feeling right now so you can track patterns over time.",
        ],
        "ms": [
            "Lakukan imbasan badan ringkas untuk menyedari sebarang ketegangan.",
            "Ambil rehat detoks digital ringkas — 15 minit tanpa telefon.",
            "Catatkan perasaan anda sekarang untuk menjejaki corak dari semasa ke semasa.",
        ],
    },
}


def generate_plan(
    emotion: Emotion,
    language: Language,
    recent_activities: Iterable[str] = (),
) -> list[SelfCareItem]:
    recent = set(recent_activities)
    pool = SELF_CARE_TEMPLATES[emotion][language]
    unseen = [activity for activity in pool if activity not in recent]
    chosen = unseen if len(unseen) >= 3 else pool
    return [SelfCareItem(day=i + 1, activity=chosen[i]) for i in range(3)]
