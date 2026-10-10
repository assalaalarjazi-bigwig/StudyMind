"""
Database Connection Manager for StudyMind.
Provides robust SQLite connection management with Write-Ahead Logging (WAL)
and strict foreign key constraints.
"""

import sqlite3
from pathlib import Path
from typing import Generator
from contextlib import contextmanager
from src.utils.config import config

SCHEMA_PATH = Path(__file__).parent / "schema.sql"

def get_connection() -> sqlite3.Connection:
    """
    Returns an optimized SQLite connection configured for concurrent reads,
    foreign key integrity, and dictionary row access.
    """
    config.ensure_directories()
    conn = sqlite3.connect(
        str(config.db_path),
        timeout=30.0,
        check_same_thread=False
    )
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for smooth concurrent reads and writes
    conn.execute("PRAGMA journal_mode=WAL;")
    # Enforce foreign key constraints
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for safe transactional database access."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    """Initialize database tables and indexes from schema.sql."""
    config.ensure_directories()
    with get_db() as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
            
        # Seed default settings if not existing
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM settings WHERE key = 'locale'")
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?)",
                ("locale", config.default_locale)
            )
        cursor.execute("SELECT 1 FROM settings WHERE key = 'model'")
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?)",
                ("model", config.generation_model)
            )

if __name__ == "__main__":
    init_db()
    print("StudyMind database successfully initialized at:", config.db_path)
