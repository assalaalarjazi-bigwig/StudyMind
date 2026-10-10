-- ============================================================================
-- StudyMind Persistent Local SQLite Schema (WAL Mode Enabled)
-- Personal Local-First Education Architecture (No Auth Overhead)
-- ============================================================================

-- Application Settings & Preferences
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Document Catalog
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_hash TEXT NOT NULL UNIQUE,
    page_count INTEGER NOT NULL DEFAULT 1,
    raw_storage_path TEXT NOT NULL,
    processed_status TEXT CHECK(processed_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page Level Text & Word Statistics
CREATE TABLE IF NOT EXISTS document_pages (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Semantic Chunks (Source of Truth for Rebuilding Vector Index)
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    vector_id TEXT NOT NULL,
    section_header TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Visual Elements (Diagrams, Charts, Tables, Figures)
CREATE TABLE IF NOT EXISTS document_figures (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    figure_id TEXT NOT NULL,
    figure_type TEXT CHECK(figure_type IN ('diagram', 'chart', 'table', 'figure', 'image')) DEFAULT 'diagram',
    image_path TEXT NOT NULL,
    caption TEXT,
    context_snippet TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Study Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    rolling_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages with Grounded Citations
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    citations_json TEXT, -- Serialized JSON: [{"document_id", "page_number", "snippet", "relevance"}]
    is_external_knowledge INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hierarchical & Thematic Summaries
CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    summary_type TEXT CHECK(summary_type IN ('quick', 'detailed', 'key_concepts', 'definitions', 'formulas', 'study_notes')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flashcard Decks
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    mode TEXT DEFAULT 'mixed',
    card_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Flashcards (Quizlet-style Spaced Repetition)
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    front_prompt TEXT NOT NULL,
    back_explanation TEXT NOT NULL,
    page_reference INTEGER,
    mastery_level INTEGER DEFAULT 0, -- 0: Unstudied, 1: Difficult, 2: Reviewing, 3: Mastered
    review_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interactive Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_difficulty TEXT CHECK(target_difficulty IN ('easy', 'medium', 'hard', 'adaptive')) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Questions (Multi-format)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('multiple_choice', 'true_false', 'multi_select', 'short_answer')) NOT NULL,
    options_json TEXT, -- JSON array of option strings
    correct_answer_json TEXT NOT NULL, -- JSON string or array
    explanation TEXT NOT NULL,
    page_reference INTEGER,
    concept_tag TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Attempt Records
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answers Per Attempt (Used to track specific student mistakes)
CREATE TABLE IF NOT EXISTS quiz_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    user_answer_json TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Memory & Concept Mastery Registry
CREATE TABLE IF NOT EXISTS learning_progress (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- High-performance indexes for foreign keys & frequent filters
CREATE INDEX IF NOT EXISTS idx_doc_pages ON document_pages(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_figures ON document_figures(document_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_doc ON learning_progress(document_id, concept_name);
