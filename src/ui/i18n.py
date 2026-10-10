"""
Bilingual Dictionary (English and Arabic) for StudyMind.
Provides localized string maps for clean, natural interface translation.
"""

MESSAGES = {
    "en": {
        "app_title": "StudyMind",
        "tagline": "Turn your study materials into an interactive learning experience.",
        "nav_library": "Library",
        "nav_workspace": "Study Workspace",
        "nav_flashcards": "Flashcards",
        "nav_quizzes": "Quizzes",
        "nav_analytics": "Analytics",
        "nav_settings": "Settings",
        
        # Upload
        "upload_title": "Upload Study Material",
        "upload_desc": "Supports PDF (100+ pages), Word (.docx), and Text (.txt)",
        "upload_button": "Process & Index Document",
        "processing": "Extracting pages, generating semantic chunks & indexing...",
        "process_complete": "Document processed and indexed successfully!",
        "existing_doc_detected": "Identified existing indexed document. Loaded instantly!",
        
        # Workspace
        "tab_chat": "Chat & RAG",
        "tab_summary": "Summaries",
        "tab_flashcards": "Flashcards",
        "tab_quiz": "Quizzes",
        "tab_figures": "Diagrams & Figures",
        
        # Chat
        "chat_placeholder": "Ask anything about your document (e.g. 'Explain this concept', 'Give an example')...",
        "chat_sources": "Verified Document Sources",
        "chat_page": "Page",
        "chat_external_warning": "Supplemental General Knowledge (outside document)",
        "clear_chat": "Clear Conversation",
        
        # Flashcards
        "card_front": "Prompt / Concept",
        "card_back": "Answer / Explanation",
        "flip_card": "Flip Card",
        "mark_difficult": "Needs Review",
        "mark_mastered": "Mastered",
        "shuffle": "Shuffle Deck",
        "generate_deck": "Generate Flashcard Deck",
        "deck_mode": "Deck Focus",
        "card_count": "Number of Cards",
        
        # Quizzes
        "generate_quiz": "Generate Interactive Quiz",
        "quiz_difficulty": "Difficulty",
        "quiz_count": "Number of Questions",
        "submit_answer": "Check Answer",
        "next_question": "Next Question",
        "quiz_results": "Quiz Results & Diagnostics",
        "score": "Score",
        "weak_areas": "Identified Weak Areas",
        "strong_areas": "Strong Mastery",
        "retry_quiz": "Retry Quiz",
        "retest_weak": "Retest My Weak Concepts",
        
        # Analytics
        "analytics_title": "Learning Memory & Mastery Dashboard",
        "total_quizzes": "Quizzes Completed",
        "avg_score": "Average Score",
        "total_cards": "Cards Studied",
        "mastered_cards": "Mastered Cards",
        "recommended_review": "Recommended Study Next Step",
        
        # Settings
        "settings_title": "Local Application Settings",
        "language_select": "Interface Language",
        "model_select": "Active Gemini Model",
        "export_backup": "Export Local Database Backup (JSON)",
        "rebuild_index": "Rebuild Chroma Vector Index from SQLite",
        "rebuild_success": "Successfully rebuilt vector index from SQLite!",
    },
    
    "ar": {
        "app_title": "StudyMind — مايند",
        "tagline": "حوّل موادك الدراسية إلى تجربة تعليمية تفاعلية وذكية.",
        "nav_library": "المكتبة",
        "nav_workspace": "مساحة الدراسة",
        "nav_flashcards": "البطاقات التعليمية",
        "nav_quizzes": "الاختبارات التفاعلية",
        "nav_analytics": "التحليلات والتقدم",
        "nav_settings": "الإعدادات",
        
        # Upload
        "upload_title": "رفع مادة دراسية",
        "upload_desc": "يدعم مستندات PDF (أكثر من 100 صفحة)، Word (.docx)، والنصوص (.txt)",
        "upload_button": "معالجة وفهرسة المستند",
        "processing": "جارٍ استخراج الصفحات وتوليد المقاطع المفهرسة...",
        "process_complete": "تمت معالجة المستند وفهرسته بنجاح!",
        "existing_doc_detected": "تم العثور على هذا المستند مسبقاً في الذاكرة المحلية!",
        
        # Workspace
        "tab_chat": "المحادثة والبحث الذكي",
        "tab_summary": "الملخصات",
        "tab_flashcards": "البطاقات",
        "tab_quiz": "الاختبارات",
        "tab_figures": "المخططات والرسوم",
        
        # Chat
        "chat_placeholder": "اسأل عن أي مفهوم في المستند (مثال: 'اشرح هذا المفهوم'، 'أعطني مثالاً')...",
        "chat_sources": "المصادر الموثقة من المستند",
        "chat_page": "الصفحة",
        "chat_external_warning": "معلومات إضافية عامة (خارج نطاق المستند)",
        "clear_chat": "مسح المحادثة",
        
        # Flashcards
        "card_front": "السؤال / المفهوم",
        "card_back": "الإجابة / الشرح",
        "flip_card": "اقلب البطاقة",
        "mark_difficult": "بحاجة لمراجعة",
        "mark_mastered": "تم الحفظ والإتقان",
        "shuffle": "خلط البطاقات",
        "generate_deck": "توليد مجموعة بطاقات",
        "deck_mode": "نوع البطاقات",
        "card_count": "عدد البطاقات",
        
        # Quizzes
        "generate_quiz": "توليد اختبار تفاعلي",
        "quiz_difficulty": "مستوى الصعوبة",
        "quiz_count": "عدد الأسئلة",
        "submit_answer": "تحقق من الإجابة",
        "next_question": "السؤال التالي",
        "quiz_results": "نتائج الاختبار والتشخيص",
        "score": "النتيجة",
        "weak_areas": "المفاهيم التي تحتاج لتقوية",
        "strong_areas": "المفاهيم المتقنة",
        "retry_quiz": "إعادة الاختبار",
        "retest_weak": "اختبار مخصص للمفاهيم الضعيفة",
        
        # Analytics
        "analytics_title": "لوحة متابعة التعلم والذاكرة الدراسية",
        "total_quizzes": "الاختبارات المنجزة",
        "avg_score": "متوسط الدرجات",
        "total_cards": "البطاقات المراجعة",
        "mastered_cards": "البطاقات المتقنة",
        "recommended_review": "خطوة المراجعة الموصى بها",
        
        # Settings
        "settings_title": "إعدادات التطبيق المحلي",
        "language_select": "لغة الواجهة",
        "model_select": "نموذج Gemini المستخدم",
        "export_backup": "تصدير نسخة احتياطية محلية (JSON)",
        "rebuild_index": "إعادة بناء فهرس الفيكتور من قاعدة البيانات",
        "rebuild_success": "تمت إعادة بناء فهرس الفيكتور بنجاح!",
    }
}

def get_text(key: str, lang: str = "en") -> str:
    """Returns localized string with English fallback."""
    locale_dict = MESSAGES.get(lang, MESSAGES["en"])
    return locale_dict.get(key, MESSAGES["en"].get(key, key))
