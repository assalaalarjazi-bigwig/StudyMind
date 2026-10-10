# StudyMind — AI Pipeline & Prompt Architecture

StudyMind interacts with Google Gemini models through the modern `@google/genai` / `google-genai` Python SDK.

---

## 1. Configurable Model Routing

StudyMind strictly decouples model strings from application logic:
- `GEMINI_GENERATION_MODEL`: `gemini-3.8-flash` (Default for fast, low-latency grounded Q&A, flashcards, and quizzes)
- `GEMINI_REASONING_MODEL`: `gemini-3.1-pro-preview` (Used for complex STEM derivations and multi-stage logic)
- `GEMINI_EMBEDDING_MODEL`: `gemini-embedding-2` (Multimodal, dense semantic vector encoding)

---

## 2. Structured Outputs with Pydantic v2

Rather than asking the model for unformatted text and attempting fragile regex parsing, StudyMind forces JSON schema compliance using Gemini's native `response_mime_type="application/json"` and `response_schema`:

```python
# Defined in src/ai/models.py
class QuizQuestionSchema(BaseModel):
  question_text: str
  question_type: Literal[
      "multiple_choice", "true_false", "multi_select", "short_answer"
  ]
  options: List[str]
  correct_answer: List[str]
  explanation: str
  page_reference: Optional[int]
  concept_tag: str
```

If the generated JSON fails Pydantic validation, it is rejected before touching SQLite, guaranteeing data integrity.

---

## 3. Strict Document Grounding Directives

The system instruction injected into every chat call enforces:
1. **Rule of Direct Evidence**: Every factual claim must cite `[Page X]`.
2. **Supplemental Demarcation**: If answering an out-of-document query (e.g. "give me an everyday analogy"), the assistant prefixes the response with `💡 Supplemental General Knowledge:`.
3. **Refusal to Invent**: If the document lacks evidence, the assistant states: *"This specific information is not mentioned in your document."*
