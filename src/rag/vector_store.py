"""
Persistent Vector Store Manager using ChromaDB.
Provides local vector storage, cosine similarity queries with document filtering,
and a disaster-recovery mechanism to rebuild the entire index from SQLite.
"""

from typing import Any, Dict, List, Optional
from src.database.repository import Repository
from src.rag.embeddings import embeddings_engine
from src.utils.config import config

COLLECTION_NAME = "studymind_chunks"

class VectorStore:
    def __init__(self):
        self._client = None
        self._collection = None
        self._init_chroma()

    def _init_chroma(self) -> None:
        """Initializes persistent ChromaDB client."""
        config.ensure_directories()
        try:
            import chromadb
            self._client = chromadb.PersistentClient(path=str(config.vector_dir))
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception:
            # Fallback if chromadb is not yet loaded
            self._client = None
            self._collection = None

    def add_chunks(self, chunks: List[Dict[str, Any]], document_id: str) -> None:
        """Embeds and indexes document chunks into the vector store."""
        if not chunks:
            return

        if not self._collection:
            self._init_chroma()
        if not self._collection:
            return

        ids = [c["id"] for c in chunks]
        texts = [c["chunk_text"] for c in chunks]
        metadatas = [
            {
                "document_id": document_id,
                "page_number": int(c["page_number"]),
                "chunk_index": int(c["chunk_index"]),
            }
            for c in chunks
        ]

        # Generate embeddings
        embeddings = embeddings_engine.get_embeddings(texts)

        # Upsert into ChromaDB
        self._collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def search(
        self,
        query: str,
        document_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic vector search for a query string.
        Filters by document_id when specified.
        """
        if not self._collection:
            self._init_chroma()
        if not self._collection:
            return []

        query_embedding = embeddings_engine.get_embeddings([query])
        if not query_embedding:
            return []

        where_filter = {"document_id": document_id} if document_id else None

        try:
            results = self._collection.query(
                query_embeddings=query_embedding,
                n_results=top_k,
                where=where_filter
            )

            hits: List[Dict[str, Any]] = []
            if results and results["ids"] and len(results["ids"][0]) > 0:
                for idx in range(len(results["ids"][0])):
                    chunk_id = results["ids"][0][idx]
                    text = results["documents"][0][idx]
                    metadata = results["metadatas"][0][idx]
                    distance = results["distances"][0][idx] if "distances" in results and results["distances"] else 0.0
                    # Cosine similarity = 1 - cosine distance
                    similarity = 1.0 - distance

                    hits.append({
                        "id": chunk_id,
                        "chunk_text": text,
                        "document_id": metadata.get("document_id"),
                        "page_number": metadata.get("page_number"),
                        "chunk_index": metadata.get("chunk_index"),
                        "similarity": round(similarity, 4)
                    })
            return hits
        except Exception:
            return []

    def delete_document_chunks(self, document_id: str) -> None:
        """Removes all indexed chunks associated with a deleted document."""
        if not self._collection:
            self._init_chroma()
        if self._collection:
            try:
                self._collection.delete(where={"document_id": document_id})
            except Exception:
                pass

    def rebuild_index_from_sqlite(self) -> int:
        """
        Reconstructs the vector index from SQLite document_chunks source of truth.
        Vital for recovery if the local vector store is deleted or corrupted.
        """
        if not self._collection:
            self._init_chroma()
        if not self._collection:
            return 0

        # Fetch all chunks from SQLite
        all_chunks = Repository.get_all_chunks_for_rebuild()
        if not all_chunks:
            return 0

        # Group by document_id and reindex
        indexed_count = 0
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for c in all_chunks:
            doc_id = c["document_id"]
            if doc_id not in grouped:
                grouped[doc_id] = []
            grouped[doc_id].append(c)

        for doc_id, doc_chunks in grouped.items():
            self.add_chunks(doc_chunks, doc_id)
            indexed_count += len(doc_chunks)

        return indexed_count

# Global Vector Store Singleton
vector_store = VectorStore()
