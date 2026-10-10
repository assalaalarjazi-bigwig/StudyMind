"""
Unit Tests for Embeddings, Vector Search, Hybrid Retrieval, and Citations.
"""

from src.rag.embeddings import embeddings_engine
from src.rag.retriever import retriever
from src.database.repository import Repository

def test_embedding_caching():
    texts = ["Distributed Systems Consensus", "Distributed Systems Consensus"]
    # First call will cache, second call should retrieve identical vector without error
    emb = embeddings_engine.get_embeddings(texts)
    assert len(emb) == 2
    assert len(emb[0]) == embeddings_engine.dimension
    assert emb[0] == emb[1]

def test_hybrid_retriever_citations():
    doc_id = Repository.save_document(
        filename="networks.txt",
        file_type="txt",
        file_size=500,
        file_hash="net_hash_99",
        page_count=1,
        raw_storage_path="/net.txt"
    )
    chunks = [
        {
            "page_number": 14,
            "chunk_index": 0,
            "chunk_text": "TCP Congestion Control incorporates Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery.",
            "token_count": 20,
            "vector_id": "vec_tcp"
        },
        {
            "page_number": 20,
            "chunk_index": 1,
            "chunk_text": "UDP is a connectionless transport protocol with no guaranteed delivery.",
            "token_count": 12,
            "vector_id": "vec_udp"
        }
    ]
    Repository.save_pages_and_chunks(doc_id, [], chunks)

    # Search for TCP
    top_chunks, citations, is_sufficient = retriever.retrieve("TCP Congestion Control Slow Start", doc_id)
    assert len(top_chunks) > 0
    assert "TCP" in top_chunks[0]["chunk_text"]
    assert len(citations) > 0
    assert citations[0]["page_number"] == 14
