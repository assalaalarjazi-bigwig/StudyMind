"""
StudyMind — AI-Powered Interactive Learning Platform
Main Streamlit Application Entrypoint.
Personal, local-first education architecture inspired by NotebookLM and Quizlet.
"""

import os
import json
import streamlit as st
from pathlib import Path

# StudyMind Internal Modules
from src.utils.config import config
from src.database.connection import init_db
from src.database.repository import Repository
from src.documents.validator import validate_and_hash_file, DocumentValidationError
from src.documents.extractor import extract_document
from src.documents.summarizer import Summarizer, SUMMARY_MODES
from src.rag.vector_store import vector_store
from src.rag.retriever import retriever
from src.ai.client import gemini_client
from src.ai.prompts import build_rag_prompt
from src.flashcards.generator import FlashcardEngine, FLASHCARD_MODES
from src.quizzes.generator import QuizEngine
from src.memory.conversation import ConversationMemory
from src.memory.learning_memory import LearningMemory
from src.ai.vision import VisionEngine
from src.ui.i18n import get_text
from src.ui.styles import get_app_css

# Page Configuration (Mobile-First, Responsive)
st.set_page_config(
    page_title="StudyMind — Interactive Learning",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize local SQLite database
init_db()

# -----------------------------------------------------------------------------
# Locale & Session Initialization
# -----------------------------------------------------------------------------
saved_lang = Repository.get_setting("locale", config.default_locale)
if "lang" not in st.session_state:
    st.session_state.lang = saved_lang

lang = st.session_state.lang

# Inject Global Directional Styling (English LTR or Arabic RTL)
st.markdown(get_app_css(lang), unsafe_allow_html=True)

# Active Document Tracker
if "active_doc_id" not in st.session_state:
    docs = Repository.list_documents()
    st.session_state.active_doc_id = docs[0]["id"] if docs else None

# Active Conversation Tracker
if "active_conv_id" not in st.session_state:
    st.session_state.active_conv_id = None

# Flashcard & Quiz Temporary Session Navigation States
if "fc_index" not in st.session_state:
    st.session_state.fc_index = 0
if "fc_flipped" not in st.session_state:
    st.session_state.fc_flipped = False
if "quiz_active_id" not in st.session_state:
    st.session_state.quiz_active_id = None
if "quiz_q_index" not in st.session_state:
    st.session_state.quiz_q_index = 0
if "quiz_user_answers" not in st.session_state:
    st.session_state.quiz_user_answers = {}
if "quiz_submitted" not in st.session_state:
    st.session_state.quiz_submitted = False

# -----------------------------------------------------------------------------
# Sidebar Navigation & Workspace Selector
# -----------------------------------------------------------------------------
with st.sidebar:
    st.title("🧠 " + get_text("app_title", lang))
    st.caption(get_text("tagline", lang))
    st.divider()

    nav_options = [
        get_text("nav_library", lang),
        get_text("nav_workspace", lang),
        get_text("nav_analytics", lang),
        get_text("nav_settings", lang)
    ]
    selected_nav = st.radio("Navigation", nav_options, label_visibility="collapsed")
    st.divider()

    # Active Document Badge
    if st.session_state.active_doc_id:
        active_doc = Repository.get_document(st.session_state.active_doc_id)
        if active_doc:
            st.markdown(f"**📖 Active Material:**")
            st.markdown(f"`{active_doc['filename']}` ({active_doc['page_count']} pages)")
    else:
        st.info("No study material loaded yet.")

# -----------------------------------------------------------------------------
# VIEW 1: LIBRARY (Document Ingestion & Catalog)
# -----------------------------------------------------------------------------
if selected_nav == get_text("nav_library", lang):
    st.header(get_text("upload_title", lang))
    st.write(get_text("upload_desc", lang))

    uploaded_file = st.file_uploader(
        "Choose file",
        type=["pdf", "docx", "txt"],
        help="Upload lecture notes, textbook chapters, or study guides.",
        label_visibility="collapsed"
    )

    if uploaded_file is not None:
        if st.button(get_text("upload_button", lang), type="primary"):
            file_bytes = uploaded_file.read()
            filename = uploaded_file.name

            try:
                with st.spinner(get_text("processing", lang)):
                    # 1. Validation & Hash
                    file_hash, file_type, file_size = validate_and_hash_file(file_bytes, filename)

                    # Deduplication check
                    existing_doc = Repository.get_document_by_hash(file_hash)
                    if existing_doc:
                        st.success(get_text("existing_doc_detected", lang))
                        st.session_state.active_doc_id = existing_doc["id"]
                    else:
                        # Save raw binary to local uploads directory
                        save_path = config.uploads_dir / f"{file_hash}_{filename}"
                        with open(save_path, "wb") as f_out:
                            f_out.write(file_bytes)

                        # Create SQLite Document Record
                        doc_id = Repository.save_document(
                            filename=filename,
                            file_type=file_type,
                            file_size=file_size,
                            file_hash=file_hash,
                            page_count=1,
                            raw_storage_path=str(save_path)
                        )

                        # 2. Sequential Extraction & Semantic Chunking
                        pages_data, chunks_data, figures_data = extract_document(file_bytes, filename, doc_id)

                        # Update Page Count
                        with Repository.get_db() as conn:
                            conn.execute("UPDATE documents SET page_count = ? WHERE id = ?", (len(pages_data), doc_id))

                        # Save pages, chunks, and extracted figures to SQLite
                        Repository.save_pages_and_chunks(doc_id, pages_data, chunks_data, figures_data)

                        # 3. Vector Embeddings & Indexing into ChromaDB
                        vector_store.add_chunks(chunks_data, doc_id)

                        st.session_state.active_doc_id = doc_id
                        st.success(get_text("process_complete", lang))
                        st.rerun()

            except DocumentValidationError as dve:
                st.error(f"Validation Error: {str(dve)}")
            except Exception as e:
                st.error(f"Processing failed: {str(e)}")

    st.divider()
    st.subheader("📚 Stored Study Materials")
    docs = Repository.list_documents()

    if not docs:
        st.caption("Your library is currently empty. Upload your first document above.")
    else:
        for d in docs:
            col1, col2, col3 = st.columns([3, 1, 1])
            with col1:
                is_active = (d["id"] == st.session_state.active_doc_id)
                prefix = "⭐ " if is_active else "📄 "
                st.markdown(f"**{prefix}{d['filename']}**")
                st.caption(f"{d['page_count']} pages · {d['file_type'].upper()} · {d['file_size_bytes'] / 1024:.1f} KB")
            with col2:
                if st.button("Open", key=f"open_{d['id']}"):
                    st.session_state.active_doc_id = d["id"]
                    st.session_state.active_conv_id = None
                    st.rerun()
            with col3:
                if st.button("Delete", key=f"del_{d['id']}"):
                    vector_store.delete_document_chunks(d["id"])
                    Repository.delete_document(d["id"])
                    if st.session_state.active_doc_id == d["id"]:
                        st.session_state.active_doc_id = None
                    st.rerun()

# -----------------------------------------------------------------------------
# VIEW 2: STUDY WORKSPACE (NotebookLM & Quizlet Experience)
# -----------------------------------------------------------------------------
elif selected_nav == get_text("nav_workspace", lang):
    if not st.session_state.active_doc_id:
        st.warning("Please upload or select a document from your Library to open the Study Workspace.")
    else:
        active_doc = Repository.get_document(st.session_state.active_doc_id)

        # Document Switcher & Inline Uploader Console
        col_hdr1, col_hdr2 = st.columns([3, 2])
        with col_hdr1:
            st.subheader(f"📖 {active_doc['filename']}")
            st.caption(f"{active_doc['page_count']} pages · {active_doc['file_type'].upper()} · Local persistent storage")
        with col_hdr2:
            all_docs = Repository.list_documents()
            doc_options = {d["id"]: d["filename"] for d in all_docs}
            selected_d_id = st.selectbox(
                "Switch Study Material",
                options=list(doc_options.keys()),
                format_func=lambda x: doc_options.get(x, x),
                index=list(doc_options.keys()).index(active_doc["id"]) if active_doc["id"] in doc_options else 0,
                label_visibility="collapsed"
            )
            if selected_d_id != st.session_state.active_doc_id:
                st.session_state.active_doc_id = selected_d_id
                st.session_state.active_conv_id = None
                st.rerun()

        # Direct in-workspace quick uploader
        with st.expander("📤 Upload & Index a New Study File (+)", expanded=False):
            quick_file = st.file_uploader("Upload PDF, DOCX, or TXT directly into workspace", type=["pdf", "docx", "txt"], key="quick_up")
            if quick_file and st.button("Process & Switch to This File", type="primary"):
                q_bytes = quick_file.read()
                q_name = quick_file.name
                f_hash, f_type, f_size = validate_and_hash_file(q_bytes, q_name)
                existing = Repository.get_document_by_hash(f_hash)
                if existing:
                    st.session_state.active_doc_id = existing["id"]
                    st.rerun()
                else:
                    save_p = config.uploads_dir / f"{f_hash}_{q_name}"
                    with open(save_p, "wb") as f_out:
                        f_out.write(q_bytes)
                    new_d_id = Repository.save_document(q_name, f_type, f_size, f_hash, 1, str(save_p))
                    p_data, c_data, fig_data = extract_document(q_bytes, q_name, new_d_id)
                    with Repository.get_db() as conn:
                        conn.execute("UPDATE documents SET page_count = ? WHERE id = ?", (len(p_data), new_d_id))
                    Repository.save_pages_and_chunks(new_d_id, p_data, c_data, fig_data)
                    vector_store.add_chunks(c_data, new_d_id)
                    st.session_state.active_doc_id = new_d_id
                    st.rerun()

        # Ensure active conversation
        if not st.session_state.active_conv_id:
            convs = Repository.list_conversations(active_doc["id"])
            if convs:
                st.session_state.active_conv_id = convs[0]["id"]
            else:
                new_id = Repository.create_conversation(active_doc["id"], "Study Session 1")
                st.session_state.active_conv_id = new_id

        # Workspace Navigation Tabs
        tab_chat, tab_summary, tab_fc, tab_quiz, tab_figures = st.tabs([
            f"💬 {get_text('tab_chat', lang)}",
            f"📑 {get_text('tab_summary', lang)}",
            f"🗂️ {get_text('tab_flashcards', lang)}",
            f"🎯 {get_text('tab_quiz', lang)}",
            f"🖼️ {get_text('tab_figures', lang)}"
        ])

        # --- TAB 1: Grounded Chat & RAG ---
        with tab_chat:
            conv_id = st.session_state.active_conv_id
            messages = Repository.get_messages(conv_id)

            # Display previous conversation messages
            for msg in messages:
                with st.chat_message(msg["role"]):
                    st.write(msg["content"])
                    if msg.get("citations"):
                        st.markdown(f"**📚 {get_text('chat_sources', lang)}:**")
                        for cit in msg["citations"]:
                            st.caption(f"• **{get_text('chat_page', lang)} {cit['page_number']}**: {cit['snippet']}")

            # Student Input
            if prompt := st.chat_input(get_text("chat_placeholder", lang)):
                # 1. Add student message to SQLite
                Repository.add_message(conv_id, "user", prompt)
                with st.chat_message("user"):
                    st.write(prompt)

                # 2. Multi-tier Conversation Memory & Vector Retrieval
                with st.spinner("Searching document knowledge..."):
                    mem_context = ConversationMemory.get_context_for_query(conv_id, prompt)
                    top_chunks, citations, is_sufficient = retriever.retrieve(prompt, active_doc["id"])

                    rag_prompt = build_rag_prompt(
                        query=prompt,
                        retrieved_chunks=top_chunks,
                        conversation_summary=mem_context.get("rolling_summary", ""),
                        recent_messages=mem_context.get("recent_messages", []),
                        language=lang
                    )

                    try:
                        ai_response = gemini_client.generate_text(
                            prompt=rag_prompt,
                            temperature=0.2,
                            max_output_tokens=2048
                        )
                    except Exception as e:
                        ai_response = f"Could not contact Gemini: {str(e)}. (Ensure GEMINI_API_KEY is configured)."

                # 3. Add AI message to SQLite with verified citations
                Repository.add_message(conv_id, "assistant", ai_response, citations=citations)
                ConversationMemory.maybe_update_rolling_summary(conv_id)

                with st.chat_message("assistant"):
                    st.write(ai_response)
                    if citations:
                        st.markdown(f"**📚 {get_text('chat_sources', lang)}:**")
                        for cit in citations:
                            st.caption(f"• **{get_text('chat_page', lang)} {cit['page_number']}**: {cit['snippet']}")

        # --- TAB 2: Grounded Summaries ---
        with tab_summary:
            st.markdown("### Generate High-Yield Summaries")
            col_s1, col_s2 = st.columns([2, 1])
            with col_s1:
                selected_mode = st.selectbox(
                    "Summary Format",
                    [m[0] for m in SUMMARY_MODES],
                    format_func=lambda x: dict(SUMMARY_MODES).get(x, x)
                )
            with col_s2:
                if st.button("Generate Summary", type="primary"):
                    with st.spinner("Synthesizing document summary..."):
                        try:
                            Summarizer.generate_summary(active_doc["id"], selected_mode, lang)
                            st.success("Summary generated!")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error: {str(e)}")

            # Display existing summaries
            summaries = Repository.get_summaries(active_doc["id"])
            if summaries:
                for s in summaries:
                    with st.expander(f"📑 {dict(SUMMARY_MODES).get(s['summary_type'], s['summary_type'])} — {s['created_at']}"):
                        st.markdown(s["content"])

        # --- TAB 3: Quizlet-Style Flashcards ---
        with tab_fc:
            decks = Repository.list_flashcard_sets(active_doc["id"])
            
            # Deck Customization & Generator Panel (Always Available)
            with st.expander("⚙️ Customize & Generate New Flashcard Deck", expanded=not decks):
                col_f1, col_f2 = st.columns(2)
                with col_f1:
                    deck_title = st.text_input("Deck Title", value="Custom Study Deck", key="fc_title")
                    deck_mode = st.selectbox(
                        "Deck Focus",
                        [m[0] for m in FLASHCARD_MODES],
                        format_func=lambda x: dict(FLASHCARD_MODES).get(x, x),
                        key="fc_mode"
                    )
                with col_f2:
                    card_num = st.slider("Select Number of Flashcards", 5, 20, 10, key="fc_num")
                    if st.button(get_text("generate_deck", lang), type="primary", key="btn_gen_deck"):
                        with st.spinner("Generating flashcards with Gemini..."):
                            try:
                                FlashcardEngine.generate_deck(active_doc["id"], deck_title, deck_mode, card_num, lang)
                                st.success("Deck created!")
                                st.session_state.fc_index = 0
                                st.rerun()
                            except Exception as e:
                                st.error(f"Generation error: {str(e)}")

            if decks:
                # Interactive Flashcard Player
                active_deck = decks[0]
                cards = Repository.get_flashcards(active_deck["id"])

                if cards:
                    total_cards = len(cards)
                    cur_idx = min(st.session_state.fc_index, total_cards - 1)
                    card = cards[cur_idx]

                    # Deck Progress Bar
                    st.progress((cur_idx + 1) / total_cards)
                    st.caption(f"Card {cur_idx + 1} of {total_cards} · Category: {card['front_prompt'][:25]}...")

                    # 3D Flip Card View
                    is_back = st.session_state.fc_flipped
                    content_text = card["back_explanation"] if is_back else card["front_prompt"]
                    side_label = "BACK (Answer / Explanation)" if is_back else "FRONT (Question / Concept)"
                    bg_color = "#f0fdf4" if is_back else "#ffffff"

                    st.markdown(
                        f"""
                        <div class="flashcard-container" style="max-width: 650px; margin: 1rem auto;">
                            <div class="flashcard-card" style="background-color: {bg_color}; padding: 2rem; border-radius: 16px; border: 1px solid #e2e8f0;">
                                <span class="metric-badge">{side_label} · Page {card.get('page_reference', '?')}</span>
                                <h3 style="margin-top: 1.5rem; font-size: 1.25rem;">{content_text}</h3>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True
                    )

                    # Controls: Clean 2-Row Layout (Zero buttons spilling out)
                    col_nav1, col_nav2, col_nav3 = st.columns(3)
                    with col_nav1:
                        if st.button("⬅️ Previous Card", use_container_width=True) and cur_idx > 0:
                            st.session_state.fc_index -= 1
                            st.session_state.fc_flipped = False
                            st.rerun()
                    with col_nav2:
                        if st.button(f"🔄 {get_text('flip_card', lang)}", type="primary", use_container_width=True):
                            st.session_state.fc_flipped = not st.session_state.fc_flipped
                            st.rerun()
                    with col_nav3:
                        if st.button("Next Card ➡️", use_container_width=True) and cur_idx < total_cards - 1:
                            st.session_state.fc_index += 1
                            st.session_state.fc_flipped = False
                            st.rerun()

                    col_stat1, col_stat2 = st.columns(2)
                    with col_stat1:
                        if st.button(f"⚠️ {get_text('mark_difficult', lang)}", use_container_width=True):
                            Repository.update_flashcard_mastery(card["id"], 1)
                            st.toast("Marked as needing review!")
                    with col_stat2:
                        if st.button(f"✅ {get_text('mark_mastered', lang)}", use_container_width=True):
                            Repository.update_flashcard_mastery(card["id"], 3)
                            st.toast("Marked as mastered!")

        # --- TAB 4: Interactive Quizzes ---
        with tab_quiz:
            quizzes = Repository.list_quizzes(active_doc["id"])
            
            # Quiz Customization Panel (Always Available)
            with st.expander("🎯 Configure & Generate New Practice Quiz", expanded=not quizzes):
                col_q1, col_q2 = st.columns(2)
                with col_q1:
                    quiz_title = st.text_input("Quiz Title", value="Comprehensive Practice Quiz", key="q_title")
                    q_diff = st.selectbox("Target Difficulty", ["easy", "medium", "hard", "adaptive"], key="q_diff")
                with col_q2:
                    q_count = st.slider("Select Number of Questions", 3, 15, 5, key="q_num")
                    if st.button(get_text("generate_quiz", lang), type="primary", key="btn_gen_quiz"):
                        with st.spinner("Generating document quiz..."):
                            try:
                                QuizEngine.generate_quiz(active_doc["id"], quiz_title, q_diff, q_count, language=lang)
                                st.success("Quiz created!")
                                st.session_state.quiz_q_index = 0
                                st.session_state.quiz_user_answers = {}
                                st.rerun()
                            except Exception as e:
                                st.error(f"Quiz error: {str(e)}")

            if quizzes:
                active_quiz = Repository.get_quiz(quizzes[0]["id"])
                questions = active_quiz.get("questions", [])

                if questions:
                    q_idx = st.session_state.quiz_q_index
                    current_q = questions[min(q_idx, len(questions) - 1)]

                    st.markdown(f"### Question {q_idx + 1} of {len(questions)}")
                    st.markdown(f"**{current_q['question_text']}**")
                    st.caption(f"Concept: {current_q['concept_tag']} · Target Page: {current_q.get('page_reference', '?')}")

                    user_ans = None
                    if current_q["question_type"] in ["multiple_choice", "true_false"]:
                        user_ans = st.radio("Select an answer:", current_q["options"], key=f"radio_{current_q['id']}")
                    elif current_q["question_type"] == "multi_select":
                        user_ans = []
                        for opt in current_q["options"]:
                            if st.checkbox(opt, key=f"cb_{current_q['id']}_{opt}"):
                                user_ans.append(opt)
                    else:
                        user_ans = st.text_input("Your answer:", key=f"txt_{current_q['id']}")

                    col_ans1, col_ans2 = st.columns(2)
                    with col_ans1:
                        if st.button("Submit Answer", type="primary", use_container_width=True):
                            is_correct = False
                            if current_q["question_type"] in ["multiple_choice", "true_false"]:
                                is_correct = (user_ans in current_q["correct_answer"])
                            elif current_q["question_type"] == "multi_select":
                                is_correct = set(user_ans or []) == set(current_q["correct_answer"])
                            else:
                                is_correct = any(user_ans.lower().strip() == ca.lower().strip() for ca in current_q["correct_answer"])

                            st.session_state.quiz_user_answers[current_q["id"]] = {
                                "question_id": current_q["id"],
                                "user_answer": user_ans,
                                "is_correct": is_correct,
                                "explanation": current_q["explanation"],
                                "concept_tag": current_q["concept_tag"]
                            }

                            if is_correct:
                                st.success("✅ Correct! " + current_q["explanation"])
                            else:
                                st.error(f"❌ Incorrect. Correct answer: {', '.join(current_q['correct_answer'])}")
                                st.info("Explanation: " + current_q["explanation"])

                    with col_ans2:
                        if q_idx < len(questions) - 1:
                            if st.button("Next Question ➡️", use_container_width=True):
                                st.session_state.quiz_q_index += 1
                                st.rerun()
                        else:
                            if st.button("Finish & Record Quiz", use_container_width=True):
                                answers_list = list(st.session_state.quiz_user_answers.values())
                                score = sum(1 for a in answers_list if a["is_correct"])
                                Repository.record_quiz_attempt(
                                    quiz_id=active_quiz["id"],
                                    doc_id=active_doc["id"],
                                    score=score,
                                    total=len(questions),
                                    answers=answers_list
                                )
                                st.success(f"Quiz completed! Score: {score}/{len(questions)}")
                                st.session_state.quiz_q_index = 0
                                st.session_state.quiz_user_answers = {}
                                st.rerun()

                # Targeted Weak Area Quiz Button
                weak_concepts = Repository.get_weak_concepts(active_doc["id"], limit=3)
                if weak_concepts:
                    st.divider()
                    st.markdown(f"**Identified Weak Areas:** {', '.join([w['concept_name'] for w in weak_concepts])}")
                    if st.button(get_text("retest_weak", lang), type="secondary"):
                        with st.spinner("Generating targeted remediation quiz..."):
                            QuizEngine.generate_quiz(
                                active_doc["id"],
                                "Remediation Quiz: Weak Concepts",
                                difficulty="adaptive",
                                question_count=5,
                                target_concepts=[w["concept_name"] for w in weak_concepts],
                                language=lang
                            )
                            st.success("Targeted quiz generated!")
                            st.session_state.quiz_q_index = 0
                            st.rerun()

        # --- TAB 5: Diagrams, Tables & Visual Elements ---
        with tab_figures:
            figures = Repository.get_document_figures(active_doc["id"])
            if not figures:
                st.info("No diagrams, figures, or charts were extracted from this document.")
            else:
                st.markdown("### Extracted Document Visuals")
                for fig in figures:
                    with st.container():
                        st.markdown(f"**{fig['caption']}** (Page {fig['page_number']})")
                        if Path(fig["image_path"]).exists():
                            st.image(fig["image_path"], width=400)
                        q_fig = st.text_input(f"Ask about {fig['figure_id']}:", key=f"q_{fig['id']}", placeholder="e.g., What does this diagram show?")
                        if st.button(f"Explain Figure", key=f"btn_{fig['id']}"):
                            with st.spinner("Analyzing diagram with Gemini Multimodal Vision..."):
                                try:
                                    explanation = VisionEngine.explain_figure(fig["id"], q_fig or "Explain this diagram", language=lang)
                                    st.markdown(f"**Explanation:**\n\n{explanation}")
                                except Exception as e:
                                    st.error(f"Multimodal error: {str(e)}")
                    st.divider()

# -----------------------------------------------------------------------------
# VIEW 3: LEARNING PROGRESS & ANALYTICS (Continue Studying)
# -----------------------------------------------------------------------------
elif selected_nav == get_text("nav_analytics", lang):
    st.header(get_text("analytics_title", lang))

    doc_id = st.session_state.active_doc_id
    rec = LearningMemory.get_study_recommendation(doc_id)

    # High-Yield Action Card
    st.markdown(
        f"""
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <h3 style="margin-top: 0; color: #1e3a8a;">🎯 {rec['headline']}</h3>
            <p style="color: #475569; font-size: 1.05rem;">{rec['action_plan']}</p>
            <p><strong>Recommended Next Step:</strong> Review {rec['recommended_cards']} flashcards + take {rec['recommended_questions']} targeted practice questions.</p>
        </div>
        """,
        unsafe_allow_html=True
    )

    analytics = Repository.get_learning_analytics(doc_id)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric(get_text("total_quizzes", lang), analytics["total_quiz_attempts"])
    c2.metric(get_text("avg_score", lang), f"{analytics['average_quiz_score']}%")
    c3.metric(get_text("total_cards", lang), analytics["total_flashcards"])
    c4.metric(get_text("mastered_cards", lang), analytics["mastered_flashcards"])

    st.divider()
    st.subheader(get_text("weak_areas", lang))
    weaks = Repository.get_weak_concepts(doc_id, limit=5)
    if weaks:
        for w in weaks:
            st.markdown(f"• **{w['concept_name']}** — Error rate: {w['error_rate']}% ({w['total_errors']} incorrect answers)")
    else:
        st.info("No recorded weaknesses yet! Take practice quizzes to map your mastery.")

# -----------------------------------------------------------------------------
# VIEW 4: SETTINGS & BACKUP (Local-First Management)
# -----------------------------------------------------------------------------
elif selected_nav == get_text("nav_settings", lang):
    st.header(get_text("settings_title", lang))

    # Locale Switcher
    current_lang = st.session_state.lang
    lang_choice = st.selectbox(
        get_text("language_select", lang),
        options=["en", "ar"],
        format_func=lambda x: "English (LTR)" if x == "en" else "العربية (RTL)",
        index=0 if current_lang == "en" else 1
    )
    if lang_choice != current_lang:
        Repository.set_setting("locale", lang_choice)
        st.session_state.lang = lang_choice
        st.rerun()

    # Model Configuration
    current_model = Repository.get_setting("model", config.generation_model)
    model_choice = st.selectbox(
        get_text("model_select", lang),
        options=["gemini-3.8-flash", "gemini-3.1-pro-preview"],
        index=0 if "flash" in current_model else 1
    )
    if model_choice != current_model:
        Repository.set_setting("model", model_choice)
        st.success(f"Model updated to: {model_choice}")

    st.divider()
    st.subheader("💾 Local Data Management & Protection")

    col_b1, col_b2 = st.columns(2)
    with col_b1:
        # Full Database JSON Backup Export
        backup_json = Repository.export_full_backup()
        st.download_button(
            label=f"⬇️ {get_text('export_backup', lang)}",
            data=backup_json,
            file_name="studymind_backup.json",
            mime="application/json",
            type="primary"
        )
        st.caption("Exports all documents, chunks, conversations, flashcards, and quizzes to a portable local file.")

    with col_b2:
        # Vector Store Disaster Recovery
        if st.button(f"🔄 {get_text('rebuild_index', lang)}"):
            with st.spinner("Rebuilding Chroma vector index from SQLite chunks..."):
                rebuilt_count = vector_store.rebuild_index_from_sqlite()
                st.success(f"{get_text('rebuild_success', lang)} ({rebuilt_count} chunks indexed)")
