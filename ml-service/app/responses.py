from .schemas import Emotion, Language

# Rule-based empathetic acknowledgements, shown before the self-care plan —
# keeps the flow feeling like a reply rather than a raw classification label.
_RESPONSE_TEMPLATES: dict[Emotion, dict[Language, str]] = {
    "happy": {
        "en": "It's great to hear things are going well for you today!",
        "ms": "Gembira mendengar semuanya berjalan lancar untuk anda hari ini!",
    },
    "sad": {
        "en": "It sounds like you're going through a tough time right now. "
        "Thank you for sharing that with me.",
        "ms": "Nampaknya anda sedang melalui masa yang sukar sekarang. Terima "
        "kasih kerana berkongsi dengan saya.",
    },
    "angry": {
        "en": "It sounds like something really frustrated you. That's a valid "
        "feeling to have.",
        "ms": "Nampaknya sesuatu benar-benar mengecewakan anda. Perasaan itu "
        "adalah sah.",
    },
    "neutral": {
        "en": "Thanks for checking in. Let's see how we can support you today.",
        "ms": "Terima kasih kerana log masuk. Mari kita lihat bagaimana kami "
        "boleh membantu anda hari ini.",
    },
}


def get_response_message(emotion: Emotion, language: Language) -> str:
    return _RESPONSE_TEMPLATES[emotion][language]
