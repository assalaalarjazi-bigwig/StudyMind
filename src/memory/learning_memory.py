"""
Learning Memory and Adaptive Recommendation Engine.
Tracks student concept mastery, error history, and synthesizes
targeted 'Continue Studying' recommendations based on real persistent data.
"""

from typing import Any, Dict, List, Optional
from src.database.repository import Repository

class LearningMemory:
    @staticmethod
    def get_study_recommendation(document_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesizes an actionable 'Continue Studying' recommendation.
        Grounded in actual quiz scores, weak topics, and flashcard states from SQLite.
        """
        analytics = Repository.get_learning_analytics(document_id)
        weak_concepts = Repository.get_weak_concepts(document_id, limit=3)
        
        doc_info = None
        if document_id:
            doc_info = Repository.get_document(document_id)

        doc_name = doc_info["filename"] if doc_info else "your study library"
        weak_names = [w["concept_name"] for w in weak_concepts]

        if not weak_concepts and analytics["total_quiz_attempts"] == 0:
            headline = f"Ready to begin studying {doc_name}!"
            action_plan = "Start by asking questions in Chat, generating study notes, or reviewing flashcards."
            recommended_cards = 10
            recommended_questions = 5
        elif weak_concepts:
            concepts_str = ", ".join(weak_names)
            headline = f"Targeted Review for {doc_name}"
            action_plan = f"Your latest assessments indicate knowledge gaps in: {concepts_str}."
            recommended_cards = min(12, len(weak_concepts) * 4)
            recommended_questions = min(10, len(weak_concepts) * 3)
        else:
            headline = f"Strong Progress in {doc_name}!"
            action_plan = f"Average quiz score: {analytics['average_quiz_score']}%. Solid mastery across core topics."
            recommended_cards = 5
            recommended_questions = 5

        return {
            "headline": headline,
            "action_plan": action_plan,
            "weak_topics": weak_names,
            "average_score": analytics["average_quiz_score"],
            "mastered_flashcards": analytics["mastered_flashcards"],
            "difficult_flashcards": analytics["difficult_flashcards"],
            "recommended_cards": recommended_cards,
            "recommended_questions": recommended_questions
        }
