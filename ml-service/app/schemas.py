from typing import Literal, Optional

from pydantic import BaseModel, Field

Emotion = Literal["happy", "sad", "angry", "neutral"]
Language = Literal["en", "ms"]


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    audio_base64: Optional[str] = None
    language: Language = "en"


class ModalityResult(BaseModel):
    label: Emotion
    confidence: float = Field(ge=0.0, le=1.0)
    probs: Optional[dict[Emotion, float]] = None


class SelfCareItem(BaseModel):
    day: int
    activity: str


class HotlineEntry(BaseModel):
    name: str
    phone: str
    description: str


class AnalyzeResponse(BaseModel):
    text_result: Optional[ModalityResult] = None
    audio_result: Optional[ModalityResult] = None
    fusion_result: ModalityResult
    crisis: bool
    response_message: str
    self_care_plan: list[SelfCareItem]
    hotlines: list[HotlineEntry] = []
