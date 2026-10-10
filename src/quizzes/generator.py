"""
Interactive Quiz Generation and Adaptive Retest Engine.
Supports multiple-choice, true/false, multi-select, and short-answer questions.
Enforces Pydantic schema validation and generates targeted weak-area assessments.
"""

from typing import List, Dict, Any, Optional
from src.ai.client import gemini_client
from src.ai.models import GeneratedQuizSchema
from src.database.repository import Repository

class QuizEngine:
    @staticmethod
    def generate_quiz(
        doc_id: str,
        title: str,
        difficulty: str = "medium",
        question_count: int = 5,
        target_concepts: Optional[List[str]] = None,
        language: str = "en"
    ) -> str:
        """
        Generates a structured interactive quiz.
        If target_concepts is provided, builds an adaptive re-test focused strictly on weak areas.
        """
        chunks = Repository.get_document_chunks(doc_id)
        if not chunks:
            raise ValueError("No document chunks available to generate quiz.")

        # Focus chunks on target concepts if specified
        if target_concepts:
            filtered_chunks = []
            for c in chunks:
                if any(concept.lower() in c["chunk_text"].lower() for concept in target_concepts):
                    filtered_chunks.append(c)
            selected_chunks = filtered_chunks[:15] if filtered_chunks else chunks[:15]
            concept_directive = f"Target these specific weak concepts that the student previously missed: {', '.join(target_concepts)}"
        else:
            step = max(1, len(chunks) // 15)
            selected_chunks = chunks[::step][:15]
            concept_directive = "Cover key overarching concepts, principles, and analytical questions across the material."

        context = "\n\n".join([f"[Page {c['page_number']}]: {c['chunk_text']}" for c in selected_chunks])
        lang_inst = "Write questions, choices, and explanations in Arabic." if language == "ar" else "Write questions in English."

        prompt = f"""
You are an expert academic evaluator creating a test in the style of Quizlet.
Base every question strictly on the document text provided.

DOCUMENT EXCERPTS:
{context}

TEST SPECIFICATIONS:
- Number of Questions: {question_count}
- Target Difficulty: {difficulty}
- Pedagogical Focus: {concept_directive}
- {lang_inst}

QUESTION REQUIREMENTS:
1. Include a mix of: 'multiple_choice', 'true_false', and 'multi_select'.
2. Provide 4 distinct choices for multiple_choice.
3. For correct_answer, provide a list of exact matching strings.
4. For explanation, clearly justify why the answer is correct with a reference to the page context.
5. Provide the exact source page_reference.
6. Provide an informative concept_tag representing the tested knowledge point.
"""
        schema_dict = GeneratedQuizSchema.model_json_schema()
        raw_json = gemini_client.generate_structured_json(
            prompt=prompt,
            schema=schema_dict
        )

        validated = GeneratedQuizSchema.model_validate(raw_json)

        questions_data = [
            {
                "question_text": q.question_text,
                "question_type": q.question_type,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "page_reference": q.page_reference,
                "concept_tag": q.concept_tag
            }
            for q in validated.questions
        ]

        quiz_id = Repository.save_quiz(
            doc_id=doc_id,
            title=title or validated.title,
            difficulty=difficulty,
            questions=questions_data
        )

        return quiz_id
