"""
Flashcards Generation Engine for StudyMind.
Generates Quizlet-style flashcards grounded in document chunks.
Uses Pydantic structured output validation and saves directly to SQLite.
"""

from typing import List, Dict, Any, Optional
from src.ai.client import gemini_client
from src.ai.models import GeneratedFlashcardSetSchema
from src.database.repository import Repository

FLASHCARD_MODES = [
    ("mixed", "Mixed Comprehensive Review"),
    ("definitions", "Definitions & Terminology"),
    ("concepts", "Core Conceptual Explanations"),
    ("formulas", "Formulas, Rules & Math"),
    ("exam_prep", "High-Yield Exam Preparation")
]

class FlashcardEngine:
    @staticmethod
    def generate_deck(
        doc_id: str,
        deck_title: str,
        mode: str = "mixed",
        card_count: int = 10,
        language: str = "en"
    ) -> str:
        """Generates a structured flashcard deck from document chunks."""
        chunks = Repository.get_document_chunks(doc_id)
        if not chunks:
            raise ValueError("No document chunks available for flashcard generation.")

        # Representative chunk sample
        sample_step = max(1, len(chunks) // 20)
        selected_chunks = chunks[::sample_step][:20]
        context = "\n\n".join([f"[Page {c['page_number']}]: {c['chunk_text']}" for c in selected_chunks])

        lang_instruction = "Generate cards in Arabic." if language == "ar" else "Generate cards in English."

        prompt = f"""
You are creating an interactive study flashcard deck inspired by Quizlet.
Base every flashcard strictly on the following document context.

DOCUMENT EXCERPTS:
{context}

DECK SPECIFICATIONS:
- Target Card Count: {card_count}
- Focus Mode: {mode}
- {lang_instruction}

INSTRUCTIONS:
1. Front: A clear question, concept, or term.
2. Back: A concise, accurate answer, definition, or explanation.
3. Include the exact source page_reference.
4. Set the category attribute appropriately ('definition', 'concept', 'formula', or 'exam_fact').
"""
        schema_dict = GeneratedFlashcardSetSchema.model_json_schema()
        raw_json = gemini_client.generate_structured_json(
            prompt=prompt,
            schema=schema_dict
        )

        validated = GeneratedFlashcardSetSchema.model_validate(raw_json)

        cards_data = [
            {
                "front": card.front,
                "back": card.back,
                "category": card.category,
                "page_reference": card.page_reference
            }
            for card in validated.cards
        ]

        deck_id = Repository.save_flashcard_set(
            doc_id=doc_id,
            title=deck_title or validated.title,
            mode=mode,
            cards=cards_data
        )

        return deck_id
