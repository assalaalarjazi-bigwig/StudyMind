"""
Hybrid Document Retriever for StudyMind.
Combines vector cosine similarity with keyword density scoring.
Applies configurable thresholds and builds verifiable citations.
"""

import re
from typing import Any, Dict, List, Tuple, Optional
from src.rag.vector_store import vector_store
from src.database.repository import Repository
from src.utils.config import config

class HybridRetriever:
    def __init__(
        self,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ):
        self.top_k = top_k or config.retrieval_top_k
        self.similarity_threshold = similarity_threshold or config.similarity_threshold

    def _keyword_score(self, query: str, text: str) -> float:
        """Calculates lexical overlap between query terms and text."""
        query_words = set(re.findall(r'\w+', query.lower()))
        if not query_words:
            return 0.0
        text_words = set(re.findall(r'\w+', text.lower()))
        overlap = query_words.intersection(text_words)
        return len(overlap) / len(query_words)

    def retrieve(
        self,
        query: str,
        document_id: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], bool]:
        """
        Retrieves the most relevant chunks for a student query.
        Returns:
            - ranked_chunks: List of chunk dicts
            - citations: Formatted source citations
            - is_sufficient_evidence: Boolean indicating if retrieval meets threshold
        """
        # 1. Vector Search
        vector_hits = vector_store.search(
            query=query,
            document_id=document_id,
            top_k=self.top_k * 2
        )

        # Fallback to SQLite direct text search if vector search returned nothing
        if not vector_hits:
            all_db_chunks = Repository.get_document_chunks(document_id)
            for c in all_db_chunks:
                score = self._keyword_score(query, c["chunk_text"])
                if score > 0.1:
                    vector_hits.append({
                        "id": c["id"],
                        "chunk_text": c["chunk_text"],
                        "document_id": c["document_id"],
                        "page_number": c["page_number"],
                        "chunk_index": c["chunk_index"],
                        "similarity": round(score, 2)
                    })

        # 2. Hybrid Score Fusion
        fused_hits: List[Dict[str, Any]] = []
        for hit in vector_hits:
            kw_score = self._keyword_score(query, hit["chunk_text"])
            vec_score = hit.get("similarity", 0.0)
            # 70% semantic embedding + 30% keyword match
            hybrid_score = (0.7 * vec_score) + (0.3 * kw_score)
            hit["hybrid_score"] = round(hybrid_score, 4)
            fused_hits.append(hit)

        # 3. Rank and Filter
        fused_hits.sort(key=lambda x: x["hybrid_score"], reverse=True)
        top_chunks = fused_hits[:self.top_k]

        # 4. Check Sufficiency
        max_score = top_chunks[0]["hybrid_score"] if top_chunks else 0.0
        is_sufficient_evidence = max_score >= self.similarity_threshold

        # 5. Build Formatted Citations
        citations: List[Dict[str, Any]] = []
        seen_pages = set()
        for c in top_chunks:
            p = c.get("page_number", 1)
            if p not in seen_pages:
                snippet = c.get("chunk_text", "")[:140].replace("\n", " ").strip() + "..."
                citations.append({
                    "document_id": document_id,
                    "page_number": p,
                    "snippet": snippet,
                    "relevance": c.get("hybrid_score", 0.0)
                })
                seen_pages.add(p)

        return top_chunks, citations, is_sufficient_evidence

# Global Retriever Singleton
retriever = HybridRetriever()
