"""AI package for StudyMind."""
from src.ai.client import gemini_client, GeminiClient
from src.ai.models import (
    QuizQuestionSchema, GeneratedQuizSchema,
    FlashcardItemSchema, GeneratedFlashcardSetSchema
)
from src.ai.prompts import (
    GROUNDED_SYSTEM_INSTRUCTION,
    build_rag_prompt,
    build_summary_prompt,
    build_figure_explanation_prompt
)

__all__ = [
    "gemini_client",
    "GeminiClient",
    "QuizQuestionSchema",
    "GeneratedQuizSchema",
    "FlashcardItemSchema",
    "GeneratedFlashcardSetSchema",
    "GROUNDED_SYSTEM_INSTRUCTION",
    "build_rag_prompt",
    "build_summary_prompt",
    "build_figure_explanation_prompt"
]
