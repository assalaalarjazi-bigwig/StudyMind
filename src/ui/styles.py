"""
Design System, Responsive Typography, and Directional CSS Controller.
Provides anti-slop, student-focused aesthetics with true Arabic RTL layout
and code/formula LTR protection.
"""

def get_app_css(lang: str = "en") -> str:
    is_ar = (lang == "ar")
    
    direction = "rtl" if is_ar else "ltr"
    align = "right" if is_ar else "left"
    font_family = "'Cairo', system-ui, -apple-system, sans-serif" if is_ar else "'Inter', system-ui, -apple-system, sans-serif"

    css = f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

    :root {{
        --font-main: {font_family};
        --bg-main: #f8fafc;
        --card-bg: #ffffff;
        --primary: #2563eb;
        --primary-light: #eff6ff;
        --accent: #059669;
        --border-color: #e2e8f0;
        --text-dark: #0f172a;
        --text-muted: #64748b;
    }}

    /* Global Typography & Direction */
    html, body, [data-testid="stAppViewContainer"], .stMarkdown, p, span, h1, h2, h3, h4, label {{
        font-family: var(--font-main) !important;
        direction: {direction} !important;
        text-align: {align} !important;
    }}

    /* Directional Isolation for Code, Math, Formulas, and Numbers */
    code, pre, .katex, .katex-display, .stCodeBlock, input[type="number"], .ltr-protected {{
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: isolate !important;
        font-family: 'Fira Code', 'Courier New', monospace !important;
    }}

    /* Mobile-first Viewport and Clean Cards */
    .stButton > button {{
        border-radius: 8px !important;
        font-weight: 500 !important;
        padding: 0.5rem 1.25rem !important;
        border: 1px solid var(--border-color) !important;
        transition: all 0.15s ease !important;
    }}
    
    .stButton > button:hover {{
        border-color: var(--primary) !important;
        color: var(--primary) !important;
    }}

    /* Chat message styling */
    [data-testid="stChatMessage"] {{
        border-radius: 12px !important;
        padding: 1rem !important;
        margin-bottom: 0.75rem !important;
        border: 1px solid var(--border-color) !important;
        direction: {direction} !important;
    }}

    /* Sources Badge */
    .source-box {{
        background-color: #f1f5f9;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-top: 0.75rem;
        border-left: 3px solid #2563eb;
        font-size: 0.875rem;
        direction: {direction};
        text-align: {align};
    }}

    /* Quizlet-style 3D Flashcard Container */
    .flashcard-container {{
        perspective: 1000px;
        width: 100%;
        min-height: 240px;
        margin: 1.5rem 0;
        cursor: pointer;
    }}

    .flashcard-card {{
        width: 100%;
        min-height: 240px;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        direction: {direction};
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }}

    .flashcard-card:hover {{
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
    }}

    /* Metric progress bar */
    .metric-badge {{
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
        margin-bottom: 0.25rem;
    }}
    </style>
    """
    return css
