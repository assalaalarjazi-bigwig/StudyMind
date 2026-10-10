"""
Unit Tests for Arabic RTL / English LTR Directional Controller.
"""

from src.ui.styles import get_app_css
from src.ui.i18n import get_text

def test_direction_css_switching():
    ar_css = get_app_css("ar")
    en_css = get_app_css("en")

    assert "direction: rtl" in ar_css
    assert "Cairo" in ar_css
    assert "direction: ltr" in en_css
    assert "Inter" in en_css

    # Crucial test: Ensure code and formulas maintain LTR protection even in Arabic mode!
    assert "direction: ltr !important" in ar_css
    assert "unicode-bidi: isolate" in ar_css

def test_bilingual_dictionary_lookups():
    assert get_text("nav_workspace", "en") == "Study Workspace"
    assert get_text("nav_workspace", "ar") == "مساحة الدراسة"
    # Fallback test
    assert get_text("non_existent_key", "ar") == "non_existent_key"
