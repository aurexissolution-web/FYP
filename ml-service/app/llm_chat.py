import os

from openai import OpenAI

from .schemas import Language

_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_MODEL = "groq/compound-mini"

_SYSTEM_PROMPT = {
    "en": (
        "You are EmoBuddy, a warm, emotionally supportive friend the user is "
        "chatting with in a mental wellness check-in app. Reply like a caring "
        "close friend would in a text conversation: casual, brief (1-3 "
        "sentences), specific to what they just said, and genuinely curious. "
        "Never sound like a therapist, a form, or a customer support bot. "
        "Do not use bullet points or lists. Do not repeat their words back "
        "verbatim as an acknowledgement (avoid stock phrases like 'thanks for "
        "sharing' or 'I understand'). Ask a natural follow-up question or "
        "react genuinely to a specific detail they mentioned. If it feels "
        "right, you can gently mention that you can put together a short "
        "self-care plan for them whenever they're ready, but don't force it "
        "into every message."
    ),
    "ms": (
        "Anda ialah EmoBuddy, seorang kawan rapat yang mesra dan prihatin "
        "dalam apl semakan kesihatan mental. Balas seperti kawan rapat "
        "berbual melalui teks: santai, ringkas (1-3 ayat), spesifik kepada "
        "apa yang baru mereka katakan, dan benar-benar ingin tahu. Jangan "
        "berbunyi seperti kaunselor, borang, atau bot sokongan pelanggan. "
        "Jangan gunakan senarai bertanda. Jangan ulang kata-kata mereka "
        "secara verbatim sebagai pengiktirafan (elakkan frasa klise seperti "
        "'terima kasih kerana berkongsi'). Tanya soalan susulan yang semula "
        "jadi atau beri reaksi tulen kepada butiran tertentu yang mereka "
        "sebut. Jika sesuai, anda boleh sebut secara lembut bahawa anda boleh "
        "sediakan pelan penjagaan diri ringkas untuk mereka bila-bila mereka "
        "sedia, tetapi jangan paksa dalam setiap mesej."
    ),
}

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY environment variable is not set. Add it to "
                "ml-service/.env or export it before starting the server."
            )
        _client = OpenAI(api_key=api_key, base_url=_GROQ_BASE_URL)
    return _client


def generate_chat_reply(messages: list[str], language: Language) -> str:
    """Generate a warm, contextual follow-up reply using an LLM (via Groq).

    `messages` is the running list of the user's own messages in this
    conversation, oldest first. We present them to the model as alternating
    user turns so it has full context of what has already been said.
    """
    client = _get_client()
    chat_messages = [{"role": "system", "content": _SYSTEM_PROMPT.get(language, _SYSTEM_PROMPT["en"])}]
    for m in messages:
        chat_messages.append({"role": "user", "content": m})

    completion = client.chat.completions.create(
        model=_MODEL,
        messages=chat_messages,
        temperature=0.9,
        max_tokens=120,
    )
    reply = completion.choices[0].message.content
    return (reply or "").strip()
