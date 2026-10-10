# StudyMind — Arabic RTL & English LTR Strategy

Localization in StudyMind is a first-class engineering feature, offering complete bidirectional layout switching rather than superficial text translation.

---

## 1. The Core Problem with Basic Arabic AI UIs

Most AI applications exhibit three critical bugs when displaying Arabic:
1. **Left-to-Right Container Trapping**: Arabic text is rendered inside LTR blocks, causing periods and question marks to jump to the wrong side of sentences.
2. **Reversed Numbers and Math**: When a container is forced into RTL blindly, equations (`O(N log N)`) and numeric constants (`2024`) get flipped or disrupted.
3. **Broken Code Blocks**: Programming syntax rendered in RTL becomes unreadable.

---

## 2. StudyMind's Reusable Direction Controller

Defined in `src/ui/styles.py`:

```css
/* Dynamic Root Injection */
html, body, [data-testid="stAppViewContainer"], .stMarkdown, p, span {
    font-family: 'Cairo', system-ui, sans-serif !important;
    direction: rtl !important;
    text-align: right !important;
}

/* LTR Directional Protection for Technical Tokens */
code, pre, .katex, .katex-display, .stCodeBlock, input[type="number"], .ltr-protected {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: isolate !important;
    font-family: 'Fira Code', 'Courier New', monospace !important;
}
```

### Key Technical Mechanisms
1. **`unicode-bidi: isolate`**: Completely isolates mathematical expressions and code tokens from surrounding Arabic directional flow.
2. **Typography Pairing**: Loads **Cairo** for Arabic (legible, modern, warm curves) and **Inter** for English.
3. **Bilingual String Dictionary**: `src/ui/i18n.py` centralizes all interface labels, preventing hardcoded text in components.
