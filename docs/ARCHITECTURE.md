# StudyMind — System Architecture & Design Philosophy

StudyMind is a personal, local-first interactive educational application that combines the deep contextual reasoning of **Google NotebookLM** with the active recall and testing tools of **Quizlet**.

---

## 1. Core Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDENT INTERACTION LAYER                       │
│    Streamlit Web UI / Responsive Viewport / Dual-Locale (LTR & RTL)    │
│    - Library & Document Ingestion                                      │
│    - Grounded Study Workspace & Chat                                   │
│    - Quizlet-Style Interactive 3D Flashcards                           │
│    - Multi-Format Practice Quizzes                                     │
│    - Learning Memory & Mastery Dashboard                               │
│    - Local Backup & Settings Management                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Python Events & Session State
┌───────────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LOGIC & ORCHESTRATION                   │
│    - Ingestion Pipeline: PyMuPDF / python-docx / Validator             │
│    - Prompt Engine: Grounded System Directives & Source Boundaries     │
│    - Memory Coordinator: 3-Tier Separation                             │
│    - Quiz & Card Evaluators: Pydantic Validation                       │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼──────────────┐ ┌──────────────▼────────────────────┐
│    LOCAL PERSISTENCE (SQLite)    │ │   VECTOR RETRIEVAL (ChromaDB)     │
│  - documents, pages, chunks      │ │  - Local Persistent Client        │
│  - figures, conversations, msgs  │ │  - Cosine Distance Search         │
│  - flashcards, quizzes, attempts │ │  - Rebuildable from SQLite Chunks │
│  - learning_progress, settings   │ └──────────────┬────────────────────┘
└──────────────────────────────────┘                │
                                                    │
                                     ┌──────────────▼────────────────────┐
                                     │         GOOGLE GEMINI API         │
                                     │  - gemini-3.8-flash (Text & RAG)  │
                                     │  - gemini-embedding-2 (Vectors)   │
                                     │  - Multimodal Vision (Diagrams)   │
                                     └───────────────────────────────────┘
```

### 1.1 Local-First & Zero SaaS Overhead
StudyMind is designed for single-student, on-device usage. It deliberately avoids:
- Multi-user authentication tables, passwords, and JWT session handling
- External cloud databases (PostgreSQL, Cloud SQL)
- Third-party hosting dependencies
All student data resides inside `data/studymind.db` (SQLite with WAL mode) and `data/vector_index/` (ChromaDB).

### 1.2 SQLite as the Single Source of Truth
While ChromaDB maintains high-dimensional vector embeddings, SQLite stores the canonical textual chunks, page indices, and document metadata. If ChromaDB data is ever corrupted or lost, the user can click **"Rebuild Chroma Vector Index from SQLite"** to reconstruct the entire vector space with zero data loss.

---

## 2. Component Taxonomy

| Module | Location | Primary Responsibility |
| :--- | :--- | :--- |
| **App Entrypoint** | `/app.py` | Streamlit UI orchestration, tab management, bidirectional layout injection. |
| **Config Engine** | `src/utils/config.py` | Centralizes model names, chunk parameters, directories, and environment variables. |
| **Database Engine** | `src/database/` | SQLite connection manager with WAL mode, schema DDL, repository layer. |
| **Document Engine** | `src/documents/` | MIME validation, PyMuPDF streaming, DOCX parsing, semantic chunking. |
| **RAG Engine** | `src/rag/` | Embeddings with SQLite cache, ChromaDB vector store, hybrid retriever. |
| **AI Engine** | `src/ai/` | Gemini client wrapper, Pydantic schemas, grounded prompt templates, vision. |
| **Memory Engine** | `src/memory/` | Layered conversation context, rolling summaries, and mastery analytics. |
| **Flashcard Engine**| `src/flashcards/` | Spaced repetition state machine, deck generator. |
| **Quiz Engine** | `src/quizzes/` | Multi-format generator, diagnostic evaluator, weak-topic remediation. |
| **Localization** | `src/ui/` | English LTR / Arabic RTL CSS controller, bilingual dictionary. |

---

## 3. Data Flow Walkthrough

```
[Student Uploads 100-Page PDF]
  │
  ├── 1. Validation (SHA-256 Hash + Magic Bytes '%PDF')
  ├── 2. Streaming Page Extraction (PyMuPDF doc.load_page())
  ├── 3. Semantic Chunking (600-800 tokens, 120 token overlap)
  ├── 4. Batch Embeddings (gemini-embedding-2)
  ├── 5. Atomic Storage:
  │      ├── SQLite: documents, document_pages, document_chunks, document_figures
  │      └── ChromaDB: dense embeddings keyed to document_chunks.id
  │
[Student Asks: "How does Slow Start work?"]
  │
  ├── 1. Hybrid Retrieval: Vector Cosine Similarity (70%) + Keyword Overlap (30%)
  ├── 2. Context Assembly: Top 5 chunks + Rolling Summary + Last 4 conversation turns
  ├── 3. Grounded Prompt Injection with explicit Page Markers ([Page 14])
  ├── 4. Gemini 3.8 Flash Generation
  ├── 5. Source Attribution: Citations parsed and rendered in clean badge UI
  └── 6. Message committed to SQLite messages table
```
