from .schemas import Emotion, Language

# Rule-based empathetic acknowledgements, shown before the self-care plan —
# keeps the flow feeling like a reply rather than a raw classification label.
_RESPONSE_TEMPLATES: dict[Emotion, dict[Language, str]] = {
    "happy": {
        "en": "That's wonderful to hear! I'm really glad you're feeling good today.",
        "ms": "Bagus sekali! Saya gembira anda berasa baik hari ini.",
    },
    "sad": {
        "en": "I'm sorry you're feeling this way. Thank you for sharing — it's okay to not be okay.",
        "ms": "Saya sedih mendengar anda berasa begini. Terima kasih kerana berkongsi — tidak mengapa untuk tidak sempurna.",
    },
    "angry": {
        "en": "That sounds frustrating. It's completely understandable to feel that way.",
        "ms": "Ia nampaknya mengecewakan. Adalah wajar untuk berasa begitu.",
    },
    "neutral": {
        "en": "Thanks for checking in. Let's take a moment to see what might help you feel a bit better today.",
        "ms": "Terima kasih kerana log masuk. Mari kita lihat apa yang boleh membantu anda berasa lebih baik hari ini.",
    },
}


def get_response_message(emotion: Emotion, language: Language) -> str:
    return _RESPONSE_TEMPLATES[emotion][language]
