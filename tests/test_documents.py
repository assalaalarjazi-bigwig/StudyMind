"""
Unit Tests for Document Validation, Extraction, and Semantic Chunking.
"""

import pytest
from src.documents.validator import validate_and_hash_file, DocumentValidationError
from src.documents.chunker import chunk_page_text, estimate_token_count
from src.documents.extractor import extract_txt

def test_file_validation_valid_txt():
    content = b"Introduction to Computer Science and Data Structures."
    file_hash, file_type, file_size = validate_and_hash_file(content, "intro.txt")
    assert file_type == "txt"
    assert file_size == len(content)
    assert len(file_hash) == 64

def test_file_validation_rejects_empty():
    with pytest.raises(DocumentValidationError, match="empty"):
        validate_and_hash_file(b"", "empty.txt")

def test_file_validation_rejects_corrupted_pdf_signature():
    with pytest.raises(DocumentValidationError, match="signature"):
        validate_and_hash_file(b"NOT_A_REAL_PDF_HEADER", "fake.pdf")

def test_semantic_chunking_bounds_and_overlap():
    long_text = "This is a detailed textbook paragraph explaining algorithms. " * 30
    chunks = chunk_page_text(page_number=1, page_text=long_text, target_tokens=100, overlap_tokens=20)
    assert len(chunks) > 1
    for c in chunks:
        assert c["page_number"] == 1
        assert c["token_count"] <= 120
        assert len(c["chunk_text"]) > 0

def test_arabic_token_estimation_and_chunking():
    arabic_text = "خوارزمية ديكسترا هي خوارزمية تستخدم لحساب أقصر مسار بين عقدتين في رسم بياني. " * 20
    tokens = estimate_token_count(arabic_text)
    assert tokens > 50
    chunks = chunk_page_text(page_number=5, page_text=arabic_text, target_tokens=80, overlap_tokens=15)
    assert len(chunks) >= 2
    assert "خوارزمية" in chunks[0]["chunk_text"]
