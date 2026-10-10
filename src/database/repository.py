"""
StudyMind Data Repository Layer.
Centralizes all SQLite persistence operations for documents, conversations,
quizzes, flashcards, learning analytics, and backups.
"""

import json
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime
from src.database.connection import get_db

class Repository:
    # -------------------------------------------------------------------------
    # Settings & Preferences
    # -------------------------------------------------------------------------
    @staticmethod
    def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
        with get_db() as conn:
            row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
            return row["value"] if row else default

    @staticmethod
    def set_setting(key: str, value: str) -> None:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
                (key, value)
            )

    # -------------------------------------------------------------------------
    # Documents & Extracted Content
    # -------------------------------------------------------------------------
    @staticmethod
    def save_document(
        filename: str,
        file_type: str,
        file_size: int,
        file_hash: str,
        page_count: int,
        raw_storage_path: str
    ) -> str:
        doc_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO documents (
                    id, filename, file_type, file_size_bytes, file_hash,
                    page_count, raw_storage_path, processed_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')
                """,
                (doc_id, filename, file_type, file_size, file_hash, page_count, raw_storage_path)
            )
        return doc_id

    @staticmethod
    def get_document_by_hash(file_hash: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM documents WHERE file_hash = ?", (file_hash,)).fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
            return dict(row) if row else None

    @staticmethod
    def list_documents() -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM documents ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def update_document_status(doc_id: str, status: str) -> None:
        with get_db() as conn:
            conn.execute("UPDATE documents SET processed_status = ? WHERE id = ?", (status, doc_id))

    @staticmethod
    def delete_document(doc_id: str) -> None:
        with get_db() as conn:
            conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))

    @staticmethod
    def save_pages_and_chunks(
        doc_id: str,
        pages_data: List[Dict[str, Any]],
        chunks_data: List[Dict[str, Any]],
        figures_data: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        with get_db() as conn:
            # Insert Pages
            for p in pages_data:
                conn.execute(
                    """
                    INSERT INTO document_pages (id, document_id, page_number, raw_text, word_count)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (p.get("id", str(uuid.uuid4())), doc_id, p["page_number"], p["raw_text"], p["word_count"])
                )
            # Insert Chunks
            for c in chunks_data:
                conn.execute(
                    """
                    INSERT INTO document_chunks (
                        id, document_id, page_number, chunk_index,
                        chunk_text, token_count, vector_id, section_header
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        c.get("id", str(uuid.uuid4())),
                        doc_id,
                        c["page_number"],
                        c["chunk_index"],
                        c["chunk_text"],
                        c["token_count"],
                        c["vector_id"],
                        c.get("section_header")
                    )
                )
            # Insert Figures if any
            if figures_data:
                for f in figures_data:
                    conn.execute(
                        """
                        INSERT INTO document_figures (
                            id, document_id, page_number, figure_id,
                            figure_type, image_path, caption, context_snippet
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            f.get("id", str(uuid.uuid4())),
                            doc_id,
                            f["page_number"],
                            f["figure_id"],
                            f.get("figure_type", "diagram"),
                            f["image_path"],
                            f.get("caption"),
                            f.get("context_snippet")
                        )
                    )
            conn.execute("UPDATE documents SET processed_status = 'completed' WHERE id = ?", (doc_id,))

    @staticmethod
    def get_document_chunks(doc_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM document_chunks WHERE document_id = ? ORDER BY page_number, chunk_index",
                (doc_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_all_chunks_for_rebuild() -> List[Dict[str, Any]]:
        """Used to regenerate the ChromaDB vector index from the SQLite source of truth."""
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM document_chunks ORDER BY document_id, page_number, chunk_index"
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_document_figures(doc_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM document_figures WHERE document_id = ? ORDER BY page_number",
                (doc_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    # -------------------------------------------------------------------------
    # Conversations & Grounded Messages
    # -------------------------------------------------------------------------
    @staticmethod
    def create_conversation(document_id: str, title: str = "New Study Session") -> str:
        conv_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                "INSERT INTO conversations (id, document_id, title) VALUES (?, ?, ?)",
                (conv_id, document_id, title)
            )
        return conv_id

    @staticmethod
    def list_conversations(document_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM conversations WHERE document_id = ? ORDER BY updated_at DESC",
                (document_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_conversation(conv_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,)).fetchone()
            return dict(row) if row else None

    @staticmethod
    def add_message(
        conv_id: str,
        role: str,
        content: str,
        citations: Optional[List[Dict[str, Any]]] = None,
        is_external_knowledge: bool = False
    ) -> str:
        msg_id = str(uuid.uuid4())
        citations_json = json.dumps(citations or [])
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO messages (id, conversation_id, role, content, citations_json, is_external_knowledge)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (msg_id, conv_id, role, content, citations_json, 1 if is_external_knowledge else 0)
            )
            conn.execute(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (conv_id,)
            )
        return msg_id

    @staticmethod
    def get_messages(conv_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        with get_db() as conn:
            query = "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
            if limit:
                query += f" LIMIT {limit}"
            rows = conn.execute(query, (conv_id,)).fetchall()
            res = []
            for r in rows:
                item = dict(r)
                item["citations"] = json.loads(item["citations_json"]) if item["citations_json"] else []
                res.append(item)
            return res

    @staticmethod
    def update_rolling_summary(conv_id: str, summary: str) -> None:
        with get_db() as conn:
            conn.execute("UPDATE conversations SET rolling_summary = ? WHERE id = ?", (summary, conv_id))

    # -------------------------------------------------------------------------
    # Summaries
    # -------------------------------------------------------------------------
    @staticmethod
    def save_summary(doc_id: str, summary_type: str, content: str) -> str:
        summary_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                "INSERT INTO summaries (id, document_id, summary_type, content) VALUES (?, ?, ?, ?)",
                (summary_id, doc_id, summary_type, content)
            )
        return summary_id

    @staticmethod
    def get_summaries(doc_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM summaries WHERE document_id = ? ORDER BY created_at DESC",
                (doc_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    # -------------------------------------------------------------------------
    # Flashcard Decks & Spaced Repetition
    # -------------------------------------------------------------------------
    @staticmethod
    def save_flashcard_set(doc_id: str, title: str, mode: str, cards: List[Dict[str, Any]]) -> str:
        set_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                "INSERT INTO flashcard_sets (id, document_id, title, mode, card_count) VALUES (?, ?, ?, ?, ?)",
                (set_id, doc_id, title, mode, len(cards))
            )
            for c in cards:
                conn.execute(
                    """
                    INSERT INTO flashcards (id, set_id, front_prompt, back_explanation, page_reference, mastery_level)
                    VALUES (?, ?, ?, ?, ?, 0)
                    """,
                    (str(uuid.uuid4()), set_id, c["front"], c["back"], c.get("page_reference"))
                )
        return set_id

    @staticmethod
    def list_flashcard_sets(doc_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM flashcard_sets WHERE document_id = ? ORDER BY created_at DESC",
                (doc_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_flashcards(set_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM flashcards WHERE set_id = ? ORDER BY mastery_level ASC, front_prompt ASC",
                (set_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def update_flashcard_mastery(card_id: str, mastery_level: int) -> None:
        """
        mastery_level:
        0 = New, 1 = Difficult (Needs review), 2 = Learning, 3 = Mastered
        """
        with get_db() as conn:
            conn.execute(
                """
                UPDATE flashcards
                SET mastery_level = ?, review_count = review_count + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (mastery_level, card_id)
            )

    # -------------------------------------------------------------------------
    # Interactive Quizzes
    # -------------------------------------------------------------------------
    @staticmethod
    def save_quiz(doc_id: str, title: str, difficulty: str, questions: List[Dict[str, Any]]) -> str:
        quiz_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                "INSERT INTO quizzes (id, document_id, title, target_difficulty) VALUES (?, ?, ?, ?)",
                (quiz_id, doc_id, title, difficulty)
            )
            for q in questions:
                conn.execute(
                    """
                    INSERT INTO quiz_questions (
                        id, quiz_id, question_text, question_type, options_json,
                        correct_answer_json, explanation, page_reference, concept_tag
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        quiz_id,
                        q["question_text"],
                        q["question_type"],
                        json.dumps(q.get("options", [])),
                        json.dumps(q["correct_answer"]),
                        q["explanation"],
                        q.get("page_reference"),
                        q.get("concept_tag", "General Concept")
                    )
                )
        return quiz_id

    @staticmethod
    def list_quizzes(doc_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM quizzes WHERE document_id = ? ORDER BY created_at DESC", (doc_id,)).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_quiz(quiz_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            quiz_row = conn.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone()
            if not quiz_row:
                return None
            quiz = dict(quiz_row)
            q_rows = conn.execute("SELECT * FROM quiz_questions WHERE quiz_id = ?", (quiz_id,)).fetchall()
            questions = []
            for r in q_rows:
                item = dict(r)
                item["options"] = json.loads(item["options_json"]) if item["options_json"] else []
                item["correct_answer"] = json.loads(item["correct_answer_json"])
                questions.append(item)
            quiz["questions"] = questions
            return quiz

    @staticmethod
    def record_quiz_attempt(
        quiz_id: str,
        doc_id: str,
        score: int,
        total: int,
        answers: List[Dict[str, Any]],
        duration_seconds: int = 0
    ) -> str:
        attempt_id = str(uuid.uuid4())
        percentage = round((score / total * 100), 1) if total > 0 else 0.0
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO quiz_attempts (id, quiz_id, score, total_questions, percentage, duration_seconds)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (attempt_id, quiz_id, score, total, percentage, duration_seconds)
            )
            for a in answers:
                is_correct = 1 if a.get("is_correct") else 0
                conn.execute(
                    """
                    INSERT INTO quiz_answers (id, attempt_id, question_id, user_answer_json, is_correct, explanation)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), attempt_id, a["question_id"], json.dumps(a["user_answer"]), is_correct, a.get("explanation"))
                )
                
                # Update learning_progress concept table
                concept = a.get("concept_tag")
                if concept:
                    err_inc = 0 if is_correct else 1
                    succ_inc = 1 if is_correct else 0
                    conn.execute(
                        """
                        INSERT INTO learning_progress (id, document_id, concept_name, error_count, success_count, last_tested_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(id) DO NOTHING
                        """,
                        (str(uuid.uuid4()), doc_id, concept, err_inc, succ_inc)
                    )
                    # Increment counter on existing concept
                    conn.execute(
                        """
                        UPDATE learning_progress
                        SET error_count = error_count + ?,
                            success_count = success_count + ?,
                            last_tested_at = CURRENT_TIMESTAMP
                        WHERE document_id = ? AND concept_name = ?
                        """,
                        (err_inc, succ_inc, doc_id, concept)
                    )
        return attempt_id

    # -------------------------------------------------------------------------
    # Learning Memory & Progress Analytics
    # -------------------------------------------------------------------------
    @staticmethod
    def get_weak_concepts(doc_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        with get_db() as conn:
            query = """
            SELECT concept_name, SUM(error_count) as total_errors, SUM(success_count) as total_success,
                   ROUND(CAST(SUM(error_count) AS FLOAT) / (SUM(error_count) + SUM(success_count) + 0.001) * 100, 1) as error_rate
            FROM learning_progress
            """
            params = []
            if doc_id:
                query += " WHERE document_id = ?"
                params.append(doc_id)
            query += " GROUP BY concept_name HAVING total_errors > 0 ORDER BY error_rate DESC, total_errors DESC LIMIT ?"
            params.append(limit)
            rows = conn.execute(query, tuple(params)).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_learning_analytics(doc_id: Optional[str] = None) -> Dict[str, Any]:
        with get_db() as conn:
            # Quiz Stats
            attempt_query = "SELECT COUNT(*) as count, AVG(percentage) as avg_score FROM quiz_attempts"
            if doc_id:
                attempt_query += " WHERE quiz_id IN (SELECT id FROM quizzes WHERE document_id = ?)"
                attempts = conn.execute(attempt_query, (doc_id,)).fetchone()
            else:
                attempts = conn.execute(attempt_query).fetchone()

            # Flashcard Stats
            fc_query = """
            SELECT 
                COUNT(*) as total_cards,
                SUM(CASE WHEN mastery_level = 3 THEN 1 ELSE 0 END) as mastered_cards,
                SUM(CASE WHEN mastery_level = 1 THEN 1 ELSE 0 END) as difficult_cards
            FROM flashcards
            """
            if doc_id:
                fc_query += " WHERE set_id IN (SELECT id FROM flashcard_sets WHERE document_id = ?)"
                fc_stats = conn.execute(fc_query, (doc_id,)).fetchone()
            else:
                fc_stats = conn.execute(fc_query).fetchone()

            return {
                "total_quiz_attempts": attempts["count"] if attempts else 0,
                "average_quiz_score": round(attempts["avg_score"], 1) if attempts and attempts["avg_score"] is not None else 0.0,
                "total_flashcards": fc_stats["total_cards"] if fc_stats else 0,
                "mastered_flashcards": fc_stats["mastered_cards"] if fc_stats and fc_stats["mastered_cards"] is not None else 0,
                "difficult_flashcards": fc_stats["difficult_cards"] if fc_stats and fc_stats["difficult_cards"] is not None else 0,
            }

    # -------------------------------------------------------------------------
    # Backup & Export / Import (Local-First Protection)
    # -------------------------------------------------------------------------
    @staticmethod
    def export_full_backup() -> str:
        """Exports all structured study data into a JSON string for portable backup."""
        with get_db() as conn:
            export_payload = {
                "version": "1.0.0",
                "exported_at": datetime.utcnow().isoformat(),
                "documents": [dict(r) for r in conn.execute("SELECT * FROM documents").fetchall()],
                "document_pages": [dict(r) for r in conn.execute("SELECT * FROM document_pages").fetchall()],
                "document_chunks": [dict(r) for r in conn.execute("SELECT * FROM document_chunks").fetchall()],
                "document_figures": [dict(r) for r in conn.execute("SELECT * FROM document_figures").fetchall()],
                "conversations": [dict(r) for r in conn.execute("SELECT * FROM conversations").fetchall()],
                "messages": [dict(r) for r in conn.execute("SELECT * FROM messages").fetchall()],
                "summaries": [dict(r) for r in conn.execute("SELECT * FROM summaries").fetchall()],
                "flashcard_sets": [dict(r) for r in conn.execute("SELECT * FROM flashcard_sets").fetchall()],
                "flashcards": [dict(r) for r in conn.execute("SELECT * FROM flashcards").fetchall()],
                "quizzes": [dict(r) for r in conn.execute("SELECT * FROM quizzes").fetchall()],
                "quiz_questions": [dict(r) for r in conn.execute("SELECT * FROM quiz_questions").fetchall()],
                "quiz_attempts": [dict(r) for r in conn.execute("SELECT * FROM quiz_attempts").fetchall()],
                "quiz_answers": [dict(r) for r in conn.execute("SELECT * FROM quiz_answers").fetchall()],
                "learning_progress": [dict(r) for r in conn.execute("SELECT * FROM learning_progress").fetchall()],
                "settings": [dict(r) for r in conn.execute("SELECT * FROM settings").fetchall()],
            }
            return json.dumps(export_payload, indent=2)
