# StudyMind — Database Design & Local Persistence

StudyMind utilizes **SQLite 3** configured in **Write-Ahead Logging (WAL) mode** as its primary structured storage engine.

---

## 1. Why SQLite?

1. **Zero External Daemon**: Runs in-process with Python. No PostgreSQL, Docker, or cloud connection required.
2. **Crash-Resistant WAL Mode**: `PRAGMA journal_mode=WAL;` allows concurrent readers while writes execute, preventing file locks.
3. **Strict Foreign Keys**: `PRAGMA foreign_keys=ON;` with `ON DELETE CASCADE` ensures child records (chunks, messages, flashcards, quizzes) are automatically pruned when a document is deleted.
4. **Portability**: The entire database lives in `data/studymind.db` and can be exported as JSON or backed up in seconds.

---

## 2. Table Specifications

### 2.1 Documents & Extracted Content
- **`documents`**: Master catalog of uploaded files (`id`, `filename`, `file_type`, `file_size_bytes`, `file_hash` UNIQUE, `page_count`, `raw_storage_path`, `processed_status`).
- **`document_pages`**: Page-level raw text and word counts (`id`, `document_id`, `page_number`, `raw_text`, `word_count`).
- **`document_chunks`**: Source of truth for vector rebuilding (`id`, `document_id`, `page_number`, `chunk_index`, `chunk_text`, `token_count`, `vector_id`, `section_header`).
- **`document_figures`**: Extracted figures, diagrams, tables (`id`, `document_id`, `page_number`, `figure_id`, `figure_type`, `image_path`, `caption`, `context_snippet`).

### 2.2 Dialogue & Summaries
- **`conversations`**: Study sessions per document (`id`, `document_id`, `title`, `rolling_summary`, `created_at`, `updated_at`).
- **`messages`**: Dialogue history (`id`, `conversation_id`, `role`, `content`, `citations_json`, `is_external_knowledge`).
- **`summaries`**: Precomputed hierarchical summaries (`id`, `document_id`, `summary_type`, `content`).

### 2.3 Flashcards (Quizlet Model)
- **`flashcard_sets`**: Decks linked to documents (`id`, `document_id`, `title`, `mode`, `card_count`).
- **`flashcards`**: Individual cards (`id`, `set_id`, `front_prompt`, `back_explanation`, `page_reference`, `mastery_level`, `review_count`).

### 2.4 Quizzes & Analytics
- **`quizzes`**: Quizzes per document (`id`, `document_id`, `title`, `target_difficulty`).
- **`quiz_questions`**: Questions (`id`, `quiz_id`, `question_text`, `question_type`, `options_json`, `correct_answer_json`, `explanation`, `page_reference`, `concept_tag`).
- **`quiz_attempts`**: Session results (`id`, `quiz_id`, `score`, `total_questions`, `percentage`, `duration_seconds`).
- **`quiz_answers`**: Specific answers per attempt (`id`, `attempt_id`, `question_id`, `user_answer_json`, `is_correct`).
- **`learning_progress`**: Error and success tallies per concept (`id`, `document_id`, `concept_name`, `error_count`, `success_count`, `last_tested_at`).
- **`settings`**: Key-value application configurations (`key`, `value`).

---

## 3. Disaster Recovery & Vector Index Rebuilding

The vector database (ChromaDB) is treated as a **rebuildable index**, not the primary source of truth.
If `data/vector_index/` is deleted or corrupted:
1. Open **Settings** in StudyMind.
2. Click **Rebuild Chroma Vector Index from SQLite**.
3. The application executes `Repository.get_all_chunks_for_rebuild()` and streams all stored chunks back into the vector store.
