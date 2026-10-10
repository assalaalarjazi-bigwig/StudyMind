# StudyMind — Document Processing & 100+ Page Pipeline

Educational materials often consist of 100+ page textbook chapters, lecture slides, and academic papers. Sending entire books into an LLM context window is inefficient, costly, and causes "lost-in-the-middle" retrieval degradation.

---

## 1. The Ingestion Pipeline

```
[ Upload: PDF / DOCX / TXT ]
             │
             ▼
  [ 1. Validator & Hash ] ── SHA-256 Deduplication Check (Instant Load if identical)
             │
             ▼
  [ 2. Page-by-Page Extraction ] ── PyMuPDF Streams doc.load_page()
             │                       (Low RAM footprint, scales to 500+ pages)
             ▼
  [ 3. Semantic Chunking ] ── 600-800 tokens with 120 token overlap
             │
             ▼
  [ 4. Visual Elements ] ── Extracts embedded diagrams & figures with page context
             │
             ▼
  [ 5. Batch Embeddings ] ── gemini-embedding-2 (cached by chunk hash)
             │
             ▼
  [ 6. Persistent Commits ] ── SQLite records + ChromaDB vector upsert
```

---

## 2. Chunking Mathematics & Overlap Strategy

- **Chunk Target**: 600–800 tokens ($\sim 2,400 - 3,200$ characters).
  - Matches the semantic scope of an academic concept, theorem, or mechanism.
- **Overlap**: 120 tokens ($\sim 15\%$).
  - Preserves sentences and technical definitions spanning boundary breaks.
- **Hierarchical Boundary Splits**:
  Chunks split cleanly on paragraph breaks (`\n\n`), sentence terminators (`. `, `! `, `؟ `), and whitespace, avoiding severed words or broken equations.

---

## 3. Visual Element Extraction

During PDF ingestion, `src/documents/extractor.py` loops over `page.get_images()`. Image objects larger than 4KB (filtering out minor icons and bullet bullets) are extracted to `data/uploads/figures/{doc_id}_p{page}_{fig_id}.png`, with their page numbers and surrounding text logged in the `document_figures` SQLite table.
