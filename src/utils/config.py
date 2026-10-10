"""
StudyMind Configuration Management Module
Loads environment variables and provides typed settings with safe defaults.
"""

import os
from dataclasses import dataclass
from pathlib import Path

# Automatically load .env if python-dotenv is present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

@dataclass(frozen=True)
class AppConfig:
    # API Credentials
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Model Identifiers (Configurable, never hardcoded in logic)
    generation_model: str = os.getenv("GEMINI_GENERATION_MODEL", "gemini-3.8-flash")
    reasoning_model: str = os.getenv("GEMINI_REASONING_MODEL", "gemini-3.1-pro-preview")
    embedding_model: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2")
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))
    
    # RAG & Chunking Parameters
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "800"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "120"))
    retrieval_top_k: int = int(os.getenv("RETRIEVAL_TOP_K", "5"))
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.60"))
    
    # Local-First Directories
    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    data_dir: Path = base_dir / os.getenv("DATA_DIRECTORY", "data")
    db_path: Path = data_dir / "studymind.db"
    vector_dir: Path = data_dir / "vector_index"
    uploads_dir: Path = data_dir / "uploads"
    figures_dir: Path = uploads_dir / "figures"
    backups_dir: Path = data_dir / "backups"
    
    # Defaults
    default_locale: str = os.getenv("DEFAULT_LOCALE", "en")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))

    def ensure_directories(self) -> None:
        """Create local data directories if they do not exist."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.vector_dir.mkdir(parents=True, exist_ok=True)
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.figures_dir.mkdir(parents=True, exist_ok=True)
        self.backups_dir.mkdir(parents=True, exist_ok=True)

# Global singleton configuration
config = AppConfig()
config.ensure_directories()
