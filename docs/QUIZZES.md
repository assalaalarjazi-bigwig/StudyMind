# StudyMind — Interactive Quiz System (Quizlet-Style)

StudyMind features an interactive quiz system that tests the student, explains mistakes, and dynamically builds remediation tests.

---

## 1. Supported Question Types

1. **Multiple Choice (`multiple_choice`)**: 4 distinct options with one correct answer.
2. **True / False (`true_false`)**: Binary conceptual evaluation with grounded justification.
3. **Multiple Select (`multi_select`)**: Complex questions requiring the student to identify all correct options.
4. **Short Answer (`short_answer`)**: Recall-based term or concept identification.

---

## 2. Interactive Testing Flow

1. **One Question at a Time**: Promotes focus and reduces cognitive overload on mobile viewports.
2. **Instant Feedback**: Clicking **"Submit Answer"** displays immediate color-coded results:
   - ✅ Correct: Validates understanding and cites source page.
   - ❌ Incorrect: Explains why the chosen option is wrong, reveals the correct answer, and cites the document.
3. **Session Recording**: The attempt score, duration, and question-level mistakes are committed to SQLite.

---

## 3. Targeted Weak-Topic Remediation

When a student finishes a quiz, any incorrect answer flags the associated `concept_tag` in `learning_progress`.
Clicking **"Retest My Weak Concepts"**:
1. Queries SQLite for concepts with the highest `error_rate`.
2. Filters document chunks matching those weak concepts.
3. Instructs Gemini to formulate brand-new practice questions focused strictly on closing those knowledge gaps.
