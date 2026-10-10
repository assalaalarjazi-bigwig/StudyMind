"""
Multimodal Vision Engine for Educational Diagrams, Figures, and Tables.
Enables students to ask 'Explain this diagram' or 'What does this chart show?'.
Uses Gemini multimodal vision combined with surrounding textual document context.
"""

import os
from pathlib import Path
from typing import Optional
from PIL import Image
from src.ai.client import gemini_client
from src.ai.prompts import build_figure_explanation_prompt
from src.database.repository import Repository
from src.utils.config import config

class VisionEngine:
    @staticmethod
    def explain_figure(
        figure_id: str,
        student_question: str = "Explain what this diagram demonstrates and how it relates to the study material.",
        language: str = "en"
    ) -> str:
        """
        Analyzes an extracted visual diagram using Gemini's multimodal capabilities
        grounded in the surrounding document text.
        """
        # Look up figure metadata from SQLite
        with Repository.get_db() as conn:
            row = conn.execute("SELECT * FROM document_figures WHERE figure_id = ? OR id = ?", (figure_id, figure_id)).fetchone()
            if not row:
                raise ValueError(f"Figure with ID '{figure_id}' not found.")
            fig = dict(row)

        image_path = Path(fig["image_path"])
        if not image_path.exists():
            raise FileNotFoundError(f"Diagram image file missing at: {image_path}")

        pil_image = Image.open(image_path)
        prompt_text = build_figure_explanation_prompt(
            caption=fig.get("caption", "Educational Figure"),
            surrounding_text=fig.get("context_snippet", ""),
            user_question=student_question
        )
        if language == "ar":
            prompt_text += "\nExplain in fluent Arabic."
        else:
            prompt_text += "\nExplain in English."

        if not gemini_client._client:
            gemini_client._init_sdk()
        if not gemini_client._client:
            raise RuntimeError("Gemini API Key is missing for multimodal analysis.")

        try:
            response = gemini_client._client.models.generate_content(
                model=config.generation_model,
                contents=[pil_image, prompt_text],
                config={"temperature": 0.2, "max_output_tokens": 1500}
            )
            return response.text or "Unable to analyze figure."
        except Exception as e:
            raise RuntimeError(f"Multimodal figure explanation failed: {str(e)}")
