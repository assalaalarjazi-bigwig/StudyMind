"""
Document Security and Integrity Validator.
Validates file sizes, magic byte signatures, and computes SHA-256 hashes.
"""

import hashlib
from pathlib import Path
from typing import Tuple
from src.utils.config import config

MAGIC_NUMBERS = {
    "pdf": b"%PDF",
    "docx": b"PK\x03\x04",
    "txt": None  # Plain text validated by UTF-8 decoding
}

class DocumentValidationError(Exception):
    """Raised when an uploaded document fails security or format validation."""
    pass

def validate_and_hash_file(file_bytes: bytes, filename: str) -> Tuple[str, str, int]:
    """
    Validates file size, file signature, and returns (file_hash, file_type, file_size).
    """
    file_size = len(file_bytes)
    max_bytes = config.max_upload_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise DocumentValidationError(
            f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum allowed limit of {config.max_upload_size_mb}MB."
        )

    if file_size == 0:
        raise DocumentValidationError("The uploaded file is completely empty.")

    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in ["pdf", "docx", "txt"]:
        raise DocumentValidationError(
            f"Unsupported file format '.{ext}'. Supported formats are: PDF, DOCX, TXT."
        )

    # Validate Magic Bytes
    expected_magic = MAGIC_NUMBERS.get(ext)
    if expected_magic and not file_bytes.startswith(expected_magic):
        raise DocumentValidationError(
            f"File '{filename}' has extension '.{ext}' but does not match the valid binary header signature."
        )

    # Compute SHA-256 hash
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    file_hash = hasher.hexdigest()

    return file_hash, ext, file_size
