"""
Semantic and Structural Document Chunker.
Splits extracted document pages into contextual chunks respecting token boundaries,
sentence and paragraph limits, and explicit page numbers.
"""

import re
import uuid
from typing import Any, Dict, List
from src.utils.config import config

def estimate_token_count(text: str) -> int:
    """
    Estimates token count across both English and Arabic text.
    For Latin scripts, ~4 characters per token.
    For Arabic/Unicode script, ~2.5 to 3 characters per token.
    """
    if not text:
        return 0
    # Check for significant Arabic characters
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    if arabic_chars > len(text) * 0.3:
        return max(1, int(len(text) / 2.8))
    return max(1, int(len(text) / 3.8))

def chunk_page_text(
    page_number: int,
    page_text: str,
    target_tokens: int = 800,
    overlap_tokens: int = 120
) -> List[Dict[str, Any]]:
    """
    Splits text from a single page into overlapping chunks.
    Preserves paragraph and sentence boundaries where possible.
    """
    if not page_text or not page_text.strip():
        return []

    # Clean redundant whitespace while keeping paragraph breaks
    cleaned_text = re.sub(r'\r\n', '\n', page_text)
    paragraphs = [p.strip() for p in cleaned_text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [cleaned_text.strip()]

    chunks: List[Dict[str, Any]] = []
    current_tokens = 0
    current_pieces: List[str] = []
    chunk_index = 0

    for para in paragraphs:
        para_tokens = estimate_token_count(para)
        
        # If a single paragraph is larger than target_tokens, split by sentences
        if para_tokens > target_tokens:
            sentences = re.split(r'(?<=[.!?؟])\s+', para)
            for sentence in sentences:
                sent_tokens = estimate_token_count(sentence)
                if current_tokens + sent_tokens > target_tokens and current_pieces:
                    chunk_text = " ".join(current_pieces).strip()
                    chunks.append({
                        "id": str(uuid.uuid4()),
                        "page_number": page_number,
                        "chunk_index": chunk_index,
                        "chunk_text": chunk_text,
                        "token_count": estimate_token_count(chunk_text),
                        "vector_id": str(uuid.uuid4())
                    })
                    chunk_index += 1
                    # Keep overlap from the end of current_pieces
                    overlap_pieces = []
                    overlap_toks = 0
                    for p in reversed(current_pieces):
                        toks = estimate_token_count(p)
                        if overlap_toks + toks <= overlap_tokens:
                            overlap_pieces.insert(0, p)
                            overlap_toks += toks
                        else:
                            break
                    current_pieces = overlap_pieces
                    current_tokens = overlap_toks

                current_pieces.append(sentence)
                current_tokens += sent_tokens
        else:
            if current_tokens + para_tokens > target_tokens and current_pieces:
                chunk_text = "\n\n".join(current_pieces).strip()
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "page_number": page_number,
                    "chunk_index": chunk_index,
                    "chunk_text": chunk_text,
                    "token_count": estimate_token_count(chunk_text),
                    "vector_id": str(uuid.uuid4())
                })
                chunk_index += 1
                # Overlap logic
                overlap_pieces = []
                overlap_toks = 0
                for p in reversed(current_pieces):
                    toks = estimate_token_count(p)
                    if overlap_toks + toks <= overlap_tokens:
                        overlap_pieces.insert(0, p)
                        overlap_toks += toks
                    else:
                        break
                current_pieces = overlap_pieces
                current_tokens = overlap_toks

            current_pieces.append(para)
            current_tokens += para_tokens

    # Flush final chunk
    if current_pieces:
        chunk_text = "\n\n".join(current_pieces).strip()
        chunks.append({
            "id": str(uuid.uuid4()),
            "page_number": page_number,
            "chunk_index": chunk_index,
            "chunk_text": chunk_text,
            "token_count": estimate_token_count(chunk_text),
            "vector_id": str(uuid.uuid4())
        })

    return chunks
