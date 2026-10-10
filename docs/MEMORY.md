# StudyMind — Three-Tier Memory Architecture

StudyMind distinguishes itself from typical AI chatbots by implementing a **Three-Tier Memory Architecture** that persists across application restarts.

---

## 1. The Three Tiers Explained

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDY SESSION MEMORY                            │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 1. DOCUMENT MEMORY │2. CONVERSATION MEM │      3. LEARNING MEMORY      │
│ - Pages & Chunks   │ - Recent Turns     │ - Concept Error History      │
│ - Document Figures │ - Rolling Summary  │ - Flashcard Mastery States   │
│ - Dense Vectors    │ - Semantic Lookup  │ - "Continue Studying" Advice │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### Tier 1: Document Memory (Semantic Knowledge)
- **Scope**: Immutable representation of the uploaded educational material.
- **Components**:
  - `document_pages`: Full raw text by page.
  - `document_chunks`: Overlapping passages (600–800 tokens) with exact token counts.
  - `document_figures`: Extracted diagrams, figures, and charts linked to their source pages.
  - `vector_index`: ChromaDB cosine space.
- **Persistence**: Permanent until the document is deleted by the student.

### Tier 2: Conversation Memory (Contextual Dialogue)
- **Scope**: Questions, explanations, and clarifications within a study session.
- **Components**:
  - **Recent Dialogue**: The last 4–6 messages injected directly into the Gemini context.
  - **Rolling Summary**: Every 6 messages, older conversation turns are recursively compressed into a 150-word state summary.
  - **Semantic Retrieval**: Older messages matching key query terms are dynamically pulled in to maintain conversational coherence over multi-hour study sessions.
- **Budgeting**: Keeps total conversation context below 1,500 tokens.

### Tier 3: Learning Memory (Pedagogical Mastery)
- **Scope**: Long-term tracking of the student's mastery, misconceptions, and progress.
- **Components**:
  - `learning_progress`: Tracks every `concept_name` tested, accumulating `error_count` and `success_count`.
  - `flashcard_reviews`: Leitner spaced repetition box levels (0: Unstudied, 1: Needs Review, 2: Reviewing, 3: Mastered).
  - `quiz_attempts`: Score history and question-level mistake bank.
- **"Continue Studying" Synthesizer**: Queries SQLite to produce real, data-driven recommendations:
  > *"You were studying TCP Congestion Control. Your last quiz score was 68%. Your weak areas were Slow Start and AIMD. Recommended next step: 8 flashcards + 5 targeted questions."*

---

## 2. Memory Interaction Matrix

| Student Action | Document Memory | Conversation Memory | Learning Memory |
| :--- | :--- | :--- | :--- |
| **Upload Document** | Chunks created & indexed | Empty | Concept registry ready |
| **Ask Chat Question** | Chunks retrieved | Turn saved + summary updated | Unchanged |
| **Flip Flashcard** | Read only | Unchanged | Card mastery level updated |
| **Take Practice Quiz**| Read only | Unchanged | Error bank & quiz score saved |
| **Click "Retest Weak"**| Chunks for weak topics retrieved | Unchanged | Generates adaptive quiz |
