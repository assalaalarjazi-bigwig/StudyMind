"""
Pydantic Schemas for Structured Gemini Responses.
Enforces rigorous validation before saving quizzes, flashcards, or diagnostics to SQLite.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class QuizQuestionSchema(BaseModel):
    question_text: str = Field(description="Clear, unambiguous test question based on the document")
    question_type: Literal["multiple_choice", "true_false", "multi_select", "short_answer"] = Field(
        description="The format of the question"
    )
    options: List[str] = Field(
        default=[],
        description="List of choices for multiple_choice or multi_select. Empty for short_answer."
    )
    correct_answer: List[str] = Field(
        description="List of strings matching the correct options, or the canonical short answer"
    )
    explanation: str = Field(
        description="Detailed explanation of why the answer is correct, citing facts from the source text"
    )
    page_reference: Optional[int] = Field(
        default=None,
        description="The source page number where the answer is found"
    )
    concept_tag: str = Field(
        description="Specific academic concept or skill tested (e.g., 'TCP Handshake', 'Mitochondria')"
    )

class GeneratedQuizSchema(BaseModel):
    title: str = Field(description="Descriptive title of the quiz")
    difficulty: Literal["easy", "medium", "hard", "adaptive"] = Field(default="medium")
    questions: List[QuizQuestionSchema] = Field(description="List of generated quiz questions")

class FlashcardItemSchema(BaseModel):
    front: str = Field(description="Question, key term, or concept prompt for the front of the card")
    back: str = Field(description="Concise definition, explanation, or formula for the back of the card")
    category: Literal["definition", "concept", "formula", "exam_fact", "mixed"] = Field(default="concept")
    page_reference: Optional[int] = Field(default=None, description="Page number where concept appears")

class GeneratedFlashcardSetSchema(BaseModel):
    title: str = Field(description="Deck title")
    mode: str = Field(default="mixed")
    cards: List[FlashcardItemSchema] = Field(description="List of study flashcards")

class ConceptDiagnosticsSchema(BaseModel):
    concept_name: str
    mastery_status: Literal["mastered", "review_needed", "critical_weakness"]
    recommended_action: str
