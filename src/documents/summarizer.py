"""
Multi-Stage Document Summarizer for StudyMind.
Generates grounded summaries across diverse study formats (Quick, Detailed,
Key Concepts, Definitions, Formulas, Study Notes) with hierarchical chunking.
"""

from typing import List, Dict, Any, Optional
from src.ai.client import gemini_client
from src.ai.prompts import build_summary_prompt
from src.database.repository import Repository

SUMMARY_MODES = [
    ("quick", "Executive Quick Summary"),
    ("detailed", "Detailed Sectional Summary"),
    ("key_concepts", "Key Concepts & Principles"),
    ("definitions", "Technical Glossary & Definitions"),
    ("formulas", "Formulas & Equations Catalog"),
    ("study_notes", "Structured High-Yield Revision Notes")
]

class Summarizer:
    @staticmethod
    def generate_summary(
        doc_id: str,
        summary_type: str = "quick",
        language: str = "en"
    ) -> str:
        """
        Generates and persists a structured document summary.
        For large documents, performs hierarchical summarization over chunk clusters.
        """
        chunks = Repository.get_document_chunks(doc_id)
        if not chunks:
            raise ValueError("Document has no processed text chunks to summarize.")

        # Hierarchical selection: Sample evenly across the entire document
        if len(chunks) > 30:
            step = max(1, len(chunks) // 30)
            selected_chunks = chunks[::step][:30]
        else:
            selected_chunks = chunks

        prompt = build_summary_prompt(selected_chunks, summary_type, language)

        content = gemini_client.generate_text(
            prompt=prompt,
            temperature=0.2,
            max_output_tokens=3000
        )

        # Persist to SQLite
        Repository.save_summary(doc_id, summary_type, content)
        return content
