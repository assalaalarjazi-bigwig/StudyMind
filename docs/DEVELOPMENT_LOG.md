# StudyMind — Chronological Development Log

This document records each architectural and engineering phase completed during the construction of StudyMind.

---

## Phase 1: Project Foundation & Architecture
- **Goal**: Establish the local-first, personal study architecture with zero authentication overhead.
- **Actions**:
  - Configured `requirements.txt` with locked dependencies (`streamlit`, `google-genai`, `pymupdf`, `python-docx`, `chromadb`, `pydantic`, `pillow`, `pytest`).
  - Created `.env.example` defining configurable models (`GEMINI_GENERATION_MODEL`, `GEMINI_EMBEDDING_MODEL`), dimensions, and chunk limits.
  - Initialized `src/utils/config.py` singleton managing environment paths and directories.
  - Implemented `src/database/schema.sql` (15 tables: documents, pages, chunks, figures, conversations, messages, summaries, flashcards, quizzes, attempts, learning_progress, settings).
  - Implemented `src/database/connection.py` enforcing SQLite WAL mode (`PRAGMA journal_mode=WAL`) and foreign keys.
  - Implemented `src/database/repository.py` providing transactional data access and backup export.
- **Verification**: `tests/test_database.py` passed verifying WAL mode, cascade deletes, and JSON backup export.

---

## Phase 2: Document Ingestion Pipeline
- **Goal**: Support 100+ page educational documents across PDF, DOCX, and TXT with low memory consumption.
- **Actions**:
  - Implemented `src/documents/validator.py` with magic byte validation and SHA-256 deduplication.
  - Implemented `src/documents/chunker.py` with recursive token splitting (600–800 tokens, 120 token overlap) and Arabic token estimation.
  - Implemented `src/documents/extractor.py` using PyMuPDF page-by-page streaming, DOCX table extraction, and embedded diagram parsing.
- **Verification**: `tests/test_documents.py` passed testing boundary preservation, token bounds, and Arabic token counting.

---

## Phase 3: Embeddings & Vector Retrieval
- **Goal**: Implement high-precision semantic retrieval with Google's latest embedding architecture and SQLite vector caching.
- **Actions**:
  - Built `src/ai/client.py` wrapping modern Google Gemini SDK.
  - Built `src/rag/embeddings.py` using `gemini-embedding-2` with 768 dimensions and SHA-256 caching in SQLite.
  - Built `src/rag/vector_store.py` with persistent ChromaDB storage and a disaster recovery `rebuild_index_from_sqlite()` method.
  - Built `src/rag/retriever.py` with hybrid score fusion (70% semantic + 30% lexical keyword overlap) and citation extraction.
- **Verification**: `tests/test_rag.py` passed confirming caching and citation generation.

---

## Phase 4: Grounded RAG Chat & Three-Tier Memory
- **Goal**: Eliminate hallucinations, enforce source citations, and manage multi-layered context.
- **Actions**:
  - Built `src/ai/prompts.py` with strict document grounding directives, page markers `[Page X]`, and labeled supplemental knowledge.
  - Built `src/memory/conversation.py` with sliding window context, semantic retrieval of older turns, and rolling summary compression.
  - Built `src/memory/learning_memory.py` synthesizing actionable "Continue Studying" recommendations.
- **Verification**: Tested context assembler and rolling summary triggers.

---

## Phase 5: Summarization, Flashcards & Quizzes
- **Goal**: Implement Quizlet-style interactive study tools and hierarchical summarization.
- **Actions**:
  - Built `src/documents/summarizer.py` supporting 6 academic summary modes (Quick, Detailed, Key Concepts, Definitions, Formulas, Notes).
  - Built `src/flashcards/generator.py` with Pydantic validation and Leitner spaced repetition states.
  - Built `src/quizzes/generator.py` supporting MCQ, True/False, Multi-select, and Short answer formats, plus adaptive weak-concept retesting.
- **Verification**: `tests/test_quizzes_and_flashcards.py` passed verifying Pydantic schema validation, scoring, and weak-area detection.

---

## Phase 6: Multimodal Vision & Arabic/English RTL
- **Goal**: First-class Arabic support and diagram explanations.
- **Actions**:
  - Built `src/ai/vision.py` analyzing extracted diagrams with Gemini multimodal vision grounded in surrounding page text.
  - Built `src/ui/styles.py` with dynamic direction injection, Cairo/Inter typography, and strict LTR isolation for math, numbers, and code.
  - Built `src/ui/i18n.py` providing bilingual translation dictionaries.
- **Verification**: `tests/test_arabic_rtl.py` passed verifying CSS direction injection and code/formula isolation.

---

## Phase 7: Mobile-First Streamlit UI & Android APK Packaging
- **Goal**: Deliver a polished, responsive Streamlit application and an automated GitHub Actions Android APK workflow.
- **Actions**:
  - Built `/app.py` tying together Library, Study Workspace (Chat, Summaries, Flashcards, Quizzes, Diagrams), Analytics, and Settings.
  - Created PWA manifest (`public/manifest.json`) and service worker (`public/sw.js`).
  - Created complete Android Gradle WebView wrapper project (`android/`) with file picker intent and back button navigation.
  - Created `.github/workflows/build-android-apk.yml` to automatically build installable debug APKs on git push.
- **Verification**: Complete test suite passed and project prepared for GitHub.

---

## Phase 8: UX Refinements & User-Controlled Generators
- **Goal**: Resolve test feedback on file switching, layout alignment, summary depth, customizable flashcards/quizzes, and full diagram gallery.
- **Actions**:
  - Added direct Document Switcher and quick local file uploader inside the Study Workspace header.
  - Redesigned the Flashcard Player into a unified console with responsive 2-row button layout, eliminating button clipping on mobile screens.
  - Added user controls to select the exact number of flashcards (5 to 20) and focus type (Concepts, Definitions, Formulas, Exam Prep).
  - Added user controls to customize practice quizzes (3 to 15 questions, difficulty: Easy, Medium, Hard, Adaptive).
  - Expanded the Summaries tab with comprehensive chapter-by-chapter breakdowns and formula catalogs.
  - Implemented the full gallery of all 6 extracted technical diagrams with interactive schematics and Gemini Vision multimodal explanations.
- **Verification**: `compile_applet` and `lint_applet` passed successfully; verified in both React web applet and Python Streamlit `app.py`.
