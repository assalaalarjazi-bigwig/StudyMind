"""
Unit Tests for Quiz Engine, Flashcard Spaced Repetition, and Learning Analytics.
"""

from src.database.repository import Repository
from src.ai.models import GeneratedQuizSchema, GeneratedFlashcardSetSchema
from src.memory.learning_memory import LearningMemory

def test_pydantic_quiz_schema_validation():
    mock_payload = {
        "title": "Data Structures Test",
        "difficulty": "medium",
        "questions": [
            {
                "question_text": "What is the worst-case time complexity of QuickSort?",
                "question_type": "multiple_choice",
                "options": ["O(N)", "O(N log N)", "O(N^2)", "O(1)"],
                "correct_answer": ["O(N^2)"],
                "explanation": "QuickSort degrades to O(N^2) when poor pivots are chosen.",
                "page_reference": 42,
                "concept_tag": "QuickSort Complexity"
            }
        ]
    }
    validated = GeneratedQuizSchema.model_validate(mock_payload)
    assert validated.title == "Data Structures Test"
    assert len(validated.questions) == 1
    assert validated.questions[0].concept_tag == "QuickSort Complexity"

def test_flashcard_spaced_repetition_progression():
    doc_id = Repository.save_document("test.txt", "txt", 100, "hash_fc_1", 1, "/fc.txt")
    deck_id = Repository.save_flashcard_set(
        doc_id=doc_id,
        title="Algorithms Deck",
        mode="concepts",
        cards=[
            {"front": "Binary Search", "back": "O(log N) search on sorted arrays", "page_reference": 5}
        ]
    )
    cards = Repository.get_flashcards(deck_id)
    assert len(cards) == 1
    card_id = cards[0]["id"]
    assert cards[0]["mastery_level"] == 0

    # Mark as difficult
    Repository.update_flashcard_mastery(card_id, 1)
    cards_updated = Repository.get_flashcards(deck_id)
    assert cards_updated[0]["mastery_level"] == 1
    assert cards_updated[0]["review_count"] == 1

    # Mark as mastered
    Repository.update_flashcard_mastery(card_id, 3)
    cards_mastered = Repository.get_flashcards(deck_id)
    assert cards_mastered[0]["mastery_level"] == 3

def test_quiz_scoring_and_learning_recommendation():
    doc_id = Repository.save_document("networking.pdf", "pdf", 200, "hash_net_2", 1, "/net2.pdf")
    quiz_id = Repository.save_quiz(
        doc_id=doc_id,
        title="TCP Protocol Quiz",
        difficulty="medium",
        questions=[
            {
                "question_text": "Is TCP connection-oriented?",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": ["True"],
                "explanation": "TCP establishes a 3-way handshake.",
                "page_reference": 10,
                "concept_tag": "TCP Handshake"
            }
        ]
    )
    quiz = Repository.get_quiz(quiz_id)
    q_id = quiz["questions"][0]["id"]

    # Student answers incorrectly
    Repository.record_quiz_attempt(
        quiz_id=quiz_id,
        doc_id=doc_id,
        score=0,
        total=1,
        answers=[
            {
                "question_id": q_id,
                "user_answer": "False",
                "is_correct": False,
                "explanation": "Incorrect answer",
                "concept_tag": "TCP Handshake"
            }
        ]
    )

    # Learning memory should flag TCP Handshake as a weak concept
    weaks = Repository.get_weak_concepts(doc_id)
    assert len(weaks) > 0
    assert weaks[0]["concept_name"] == "TCP Handshake"

    # Recommendation synthesis
    rec = LearningMemory.get_study_recommendation(doc_id)
    assert "TCP Handshake" in rec["weak_topics"]
