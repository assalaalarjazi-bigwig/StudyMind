"""
Centralized Prompt Engineering Engine for StudyMind.
Enforces strict document grounding, explicit citation syntax,
and clear demarcation between document-backed facts and general knowledge.
"""

from typing import List, Dict, Any

GROUNDED_SYSTEM_INSTRUCTION = """
You are StudyMind, an expert interactive learning companion modeled after the best pedagogical principles of Google NotebookLM and Quizlet.

YOUR RULES OF OPERATION:
1. STRICT DOCUMENT GROUNDING:
   - Your primary source of truth is the provided document context.
   - For every factual statement supported by the document, cite the exact source page in the format: [Page X] or [Page X, Section Y].
   - If a student asks a question whose answer is NOT found in the document, you must clearly declare:
     "This specific information is not mentioned in your document."
   - You may then provide an explanation using general educational knowledge, but you MUST explicitly prefix it with:
     "💡 Supplemental General Knowledge: ..."
   - NEVER present external general knowledge as if it came from the student's uploaded document.

2. CLEAR EDUCATIONAL TONE:
   - Explain concepts clearly, intuitively, and rigorously.
   - Use analogies, step-by-step breakdowns, and examples when helpful.
   - Format equations, code blocks, and lists cleanly.
   - Maintain the student's chosen language (English or Arabic). If the student writes in Arabic, respond in fluent, natural Arabic with appropriate right-to-left formatting.
"""

def build_rag_prompt(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    conversation_summary: str = "",
    recent_messages: List[Dict[str, Any]] = None,
    language: str = "en"
) -> str:
    """Builds a grounded prompt with retrieved document context, conversation summary, and recent messages."""
    context_blocks = []
    for idx, c in enumerate(retrieved_chunks):
        p_num = c.get("page_number", "?")
        text = c.get("chunk_text", "").strip()
        context_blocks.append(f"--- [EXCERPT {idx+1} | Page {p_num}] ---\n{text}")

    context_str = "\n\n".join(context_blocks) if context_blocks else "No direct document matches found."

    history_blocks = []
    if recent_messages:
        for m in recent_messages[-4:]:
            role = "Student" if m["role"] == "user" else "StudyMind"
            history_blocks.append(f"{role}: {m['content']}")
    history_str = "\n".join(history_blocks) if history_blocks else "None"

    lang_instruction = "Respond in Arabic." if language == "ar" else "Respond in English."

    prompt = f"""
DOCUMENT CONTEXT:
{context_str}

CONVERSATION SUMMARY:
{conversation_summary if conversation_summary else "No prior conversation summary."}

RECENT DISCUSSION:
{history_str}

STUDENT QUESTION:
{query}

INSTRUCTIONS:
1. Answer the student's question primarily using the DOCUMENT CONTEXT above.
2. Provide page citations like [Page X] for facts drawn from the text.
3. If the answer requires external background, label it clearly with "💡 Supplemental General Knowledge:".
4. End your response with a concise bulleted "Sources" list mentioning the relevant pages.
5. {lang_instruction}
"""
    return prompt.strip()

def build_summary_prompt(chunks: List[Dict[str, Any]], summary_type: str, language: str = "en") -> str:
    combined_text = "\n\n".join([f"[Page {c['page_number']}]: {c['chunk_text']}" for c in chunks[:40]])
    lang_inst = "Generate the summary in Arabic." if language == "ar" else "Generate the summary in English."
    
    type_descriptions = {
        "quick": "a concise high-level executive summary of the document's central thesis and key takeaways",
        "detailed": "a comprehensive, structured summary broken down by core sections with thorough explanations",
        "key_concepts": "a catalog of the main concepts, principles, and paradigms introduced in the text",
        "definitions": "a glossary of technical terms, acronyms, and their exact definitions",
        "formulas": "a curated list of formulas, equations, rules, or algorithms with explanations of each variable",
        "study_notes": "structured, student-friendly revision notes with bullet points and mnemonics"
    }

    desc = type_descriptions.get(summary_type, "a clear study summary")
    return f"""
Analyze the following document excerpts and create {desc}.
Base your response strictly on the text provided.
{lang_inst}

DOCUMENT EXCERPTS:
{combined_text}
"""

def build_figure_explanation_prompt(caption: str, surrounding_text: str, user_question: str) -> str:
    return f"""
The student is asking about a visual diagram/figure from their study material.

FIGURE METADATA:
{caption}

SURROUNDING DOCUMENT CONTEXT:
{surrounding_text}

STUDENT QUESTION:
{user_question}

Explain what this visual element represents, how it functions, and how it connects to the core concepts discussed in the document.
"""
