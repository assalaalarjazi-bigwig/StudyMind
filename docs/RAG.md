# StudyMind — RAG Architecture & Grounded Retrieval

Retrieval-Augmented Generation (RAG) is the algorithmic backbone of StudyMind. It guarantees that answers provided by the AI are grounded in the student's actual study material rather than the model's unconstrained training memory.

---

## 1. The RAG Pipeline

```
┌────────────────────────────────────────────────────────┐
│               STUDENT QUERY: "What is AIMD?"          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 1. QUERY ENCODING & HYBRID RETRIEVAL                   │
│    - Vector Search: gemini-embedding-2 (768 dims)      │
│    - Keyword Filter: Lexical token density             │
│    - Weighted Score = 0.7 * Sim(Vector) + 0.3 * Sim(KW)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 2. RELEVANCE & SUFFICIENCY EVALUATION                  │
│    - Is Max(Score) >= Configurable Threshold (0.60)?   │
│    - If NO: Trigger "Not in Document" fallback         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 3. CONTEXT ASSEMBLY & PROMPT INJECTION                 │
│    - Top-5 Chunks tagged with [Page X] markers         │
│    - Layered Conversation Memory (Rolling Summary)     │
│    - Grounding Directives                              │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 4. GEMINI GENERATION & VERIFIED CITATIONS              │
│    - Response text with facts mapped to page tokens    │
│    - Clean UI source badges for immediate verification │
└────────────────────────────────────────────────────────┘
```

---

## 2. Embedding Model: `gemini-embedding-2`

### Why Not `text-embedding-004`?
Google's latest embedding architecture (`gemini-embedding-2`) offers native multimodal capabilities and higher multilingual semantic alignment, making it uniquely suited for educational documents containing math formulas, Arabic script, and technical tables.

### Configurable Output Dimensions
The embedding dimension is governed by `EMBEDDING_DIMENSION=768` in `.env`. 768 dimensions strike an optimal balance between retrieval precision and local vector storage footprint on mobile devices.

### Embedding Cache
To prevent redundant API fees and rate-limit friction, `src/rag/embeddings.py` checks an internal SQLite table:
```sql
SELECT embedding_json FROM embedding_cache WHERE chunk_hash = ? AND model_name = ?
```
If a chunk's text has been embedded previously, its vector is retrieved locally in $\sim 0.1$ms.

---

## 3. Hybrid Fusion: Dense Semantic + Sparse Keyword

Standard vector search alone can struggle with specific acronyms (e.g., `AIMD`, `MTU`, `OSPF`) when the vector space maps to general networking concepts.

StudyMind uses **Hybrid Score Fusion**:
$$\text{Score} = (0.7 \times \text{CosineSimilarity}) + (0.3 \times \text{KeywordDensity})$$

Where $\text{CosineSimilarity} = 1 - \text{CosineDistance}$.

---

## 4. Citation and Source Verification

Instead of cluttering sentences with raw bracketed tokens, StudyMind renders a distinct **Sources** block below each assistant response:

```
Answer text explaining Additive Increase Multiplicative Decrease...

📚 Verified Document Sources:
• Page 14: "AIMD is a feedback control algorithm that adjusts the congestion window..."
• Page 16: "The additive increment is triggered upon successful ACK reception..."
```

---

## 5. Mitigating Hallucinations

StudyMind mitigates LLM hallucinations through three strict prompt constraints:
1. **Rule of Direct Evidence**: The assistant is instructed never to fabricate document content.
2. **Explicit Partitioning**: If the student asks for general knowledge or analogies outside the text, the model must prefix that paragraph with:
   `💡 Supplemental General Knowledge (outside document): ...`
3. **Out-of-Scope Fallback**: If the query has zero semantic presence in the document, the assistant explicitly alerts the user rather than guessing.
