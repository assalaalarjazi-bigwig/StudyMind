"""
Unit Tests for SQLite Persistence and Repository Layer.
"""

import json
from src.database.repository import Repository
from src.database.connection import get_connection

def test_sqlite_wal_and_foreign_keys():
    conn = get_connection()
    wal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
    fk_enabled = conn.execute("PRAGMA foreign_keys;").fetchone()[0]
    conn.close()

    assert wal_mode.lower() == "wal"
    assert fk_enabled == 1

def test_document_lifecycle_and_cascade_delete():
    # 1. Save Document
    doc_id = Repository.save_document(
        filename="operating_systems.pdf",
        file_type="pdf",
        file_size=204800,
        file_hash="hash_os_12345",
        page_count=2,
        raw_storage_path="/path/test.pdf"
    )
    assert doc_id is not None

    # 2. Add Pages & Chunks
    pages = [{"page_number": 1, "raw_text": "CPU Scheduling Algorithms", "word_count": 3}]
    chunks = [{
        "page_number": 1,
        "chunk_index": 0,
        "chunk_text": "Round Robin and Priority Scheduling are fundamental operating system algorithms.",
        "token_count": 12,
        "vector_id": "vec_1"
    }]
    Repository.save_pages_and_chunks(doc_id, pages, chunks)

    fetched_chunks = Repository.get_document_chunks(doc_id)
    assert len(fetched_chunks) == 1
    assert "Round Robin" in fetched_chunks[0]["chunk_text"]

    # 3. Create Conversation & Message
    conv_id = Repository.create_conversation(doc_id, "Test Discussion")
    msg_id = Repository.add_message(conv_id, "user", "What is Round Robin?")
    messages = Repository.get_messages(conv_id)
    assert len(messages) == 1

    # 4. Delete Document (should cascade delete chunks, pages, conversations)
    Repository.delete_document(doc_id)
    assert Repository.get_document(doc_id) is None
    assert len(Repository.get_document_chunks(doc_id)) == 0
    assert Repository.get_conversation(conv_id) is None

def test_backup_export():
    doc_id = Repository.save_document(
        filename="biology.pdf",
        file_type="pdf",
        file_size=1024,
        file_hash="bio_hash_99",
        page_count=1,
        raw_storage_path="/bio.pdf"
    )
    backup_str = Repository.export_full_backup()
    data = json.loads(backup_str)
    assert data["version"] == "1.0.0"
    assert any(d["id"] == doc_id for d in data["documents"])
