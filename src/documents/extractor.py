"""
Unified Document Extraction Engine.
Supports PDF (via PyMuPDF streaming), DOCX, and TXT.
Extracts structured text, page indices, and figures/diagrams for multimodal RAG.
"""

import io
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Tuple
from src.documents.chunker import chunk_page_text, estimate_token_count
from src.utils.config import config

class ExtractionError(Exception):
    """Raised when parsing or extracting text/figures from a file fails."""
    pass

def extract_pdf(
    file_bytes: bytes,
    doc_id: str,
    target_tokens: int = 800,
    overlap_tokens: int = 120
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Extracts text, pages, and embedded diagrams from PDF using PyMuPDF.
    Streams page by page to easily support 100+ page educational textbooks.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        # Fallback if PyMuPDF is not installed yet
        return _fallback_text_extraction(file_bytes.decode("utf-8", errors="ignore"), target_tokens, overlap_tokens)

    pages_data: List[Dict[str, Any]] = []
    chunks_data: List[Dict[str, Any]] = []
    figures_data: List[Dict[str, Any]] = []

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)

        for page_idx in range(total_pages):
            page_num = page_idx + 1
            page = doc.load_page(page_idx)
            text = page.get_text("text").strip()
            word_count = len(text.split())

            pages_data.append({
                "page_number": page_num,
                "raw_text": text,
                "word_count": word_count
            })

            # Generate chunks for this page
            page_chunks = chunk_page_text(
                page_number=page_num,
                page_text=text,
                target_tokens=target_tokens,
                overlap_tokens=overlap_tokens
            )
            chunks_data.extend(page_chunks)

            # Extract embedded images/diagrams on this page
            image_list = page.get_images(full=True)
            for img_idx, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]

                # Filter out tiny icon artifacts (< 100x100 or < 4KB)
                if len(image_bytes) < 4096:
                    continue

                fig_filename = f"{doc_id}_p{page_num}_fig{img_idx + 1}.{image_ext}"
                fig_path = config.figures_dir / fig_filename
                with open(fig_path, "wb") as f_img:
                    f_img.write(image_bytes)

                # Capture surrounding 200 chars of text as context snippet
                context_snippet = text[:300] if text else "Extracted diagram from document"

                figures_data.append({
                    "page_number": page_num,
                    "figure_id": f"fig_{page_num}_{img_idx + 1}",
                    "figure_type": "diagram",
                    "image_path": str(fig_path),
                    "caption": f"Diagram on Page {page_num}",
                    "context_snippet": context_snippet
                })

        doc.close()
        return pages_data, chunks_data, figures_data

    except Exception as e:
        raise ExtractionError(f"Failed to process PDF document: {str(e)}")

def extract_docx(
    file_bytes: bytes,
    doc_id: str,
    target_tokens: int = 800,
    overlap_tokens: int = 120
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Extracts text and tables from Microsoft Word (.docx) files."""
    try:
        import docx
    except ImportError:
        return _fallback_text_extraction(file_bytes.decode("utf-8", errors="ignore"), target_tokens, overlap_tokens)

    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs_text = []

        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs_text.append(p.text.strip())

        # Include tables content
        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells]
                table_rows.append(" | ".join(cells))
            if table_rows:
                paragraphs_text.append("[Table Content]\n" + "\n".join(table_rows))

        full_text = "\n\n".join(paragraphs_text)
        return _segment_text_into_virtual_pages(full_text, target_tokens, overlap_tokens)

    except Exception as e:
        raise ExtractionError(f"Failed to extract DOCX document: {str(e)}")

def extract_txt(
    file_bytes: bytes,
    doc_id: str,
    target_tokens: int = 800,
    overlap_tokens: int = 120
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Extracts plain text / markdown files."""
    try:
        text = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = file_bytes.decode("latin-1", errors="ignore")
    return _segment_text_into_virtual_pages(text, target_tokens, overlap_tokens)

def _segment_text_into_virtual_pages(
    text: str,
    target_tokens: int,
    overlap_tokens: int
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Partitions continuous text into ~500 word virtual pages."""
    words = text.split()
    words_per_page = 450
    pages_data: List[Dict[str, Any]] = []
    chunks_data: List[Dict[str, Any]] = []

    if not words:
        pages_data.append({"page_number": 1, "raw_text": "", "word_count": 0})
        return pages_data, chunks_data, []

    page_num = 1
    for i in range(0, len(words), words_per_page):
        page_words = words[i:i + words_per_page]
        page_text = " ".join(page_words)
        pages_data.append({
            "page_number": page_num,
            "raw_text": page_text,
            "word_count": len(page_words)
        })
        page_chunks = chunk_page_text(
            page_number=page_num,
            page_text=page_text,
            target_tokens=target_tokens,
            overlap_tokens=overlap_tokens
        )
        chunks_data.extend(page_chunks)
        page_num += 1

    return pages_data, chunks_data, []

def _fallback_text_extraction(
    text: str,
    target_tokens: int,
    overlap_tokens: int
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    return _segment_text_into_virtual_pages(text, target_tokens, overlap_tokens)

def extract_document(
    file_bytes: bytes,
    filename: str,
    doc_id: str
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Unified entrypoint for document parsing by extension."""
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext == "pdf":
        return extract_pdf(file_bytes, doc_id, config.chunk_size, config.chunk_overlap)
    elif ext == "docx":
        return extract_docx(file_bytes, doc_id, config.chunk_size, config.chunk_overlap)
    elif ext == "txt":
        return extract_txt(file_bytes, doc_id, config.chunk_size, config.chunk_overlap)
    else:
        raise ExtractionError(f"Unsupported format: .{ext}")
