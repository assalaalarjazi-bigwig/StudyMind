"""
Pytest Fixtures and Mock Environment for StudyMind.
Provides isolated in-memory or temporary SQLite test databases and mock AI clients.
"""

import os
import pytest
import tempfile
from pathlib import Path
from src.utils.config import config
from src.database.connection import init_db, get_connection

@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch, tmp_path):
    """Sets up an isolated temporary database for each test run."""
    test_db = tmp_path / "test_studymind.db"
    test_vector = tmp_path / "test_vector_index"
    test_uploads = tmp_path / "test_uploads"
    
    test_vector.mkdir(parents=True, exist_ok=True)
    test_uploads.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(config, "db_path", test_db)
    monkeypatch.setattr(config, "vector_dir", test_vector)
    monkeypatch.setattr(config, "uploads_dir", test_uploads)

    init_db()
    yield
