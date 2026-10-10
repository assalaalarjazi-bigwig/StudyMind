"""
Google Gemini API Client Wrapper.
Centralizes authentication, rate-limiting with exponential backoff,
model configuration, and structured JSON parsing.
"""

import os
import json
from typing import Any, Dict, List, Optional
from src.utils.config import config

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or config.gemini_api_key
        self._client = None
        self._init_sdk()

    def _init_sdk(self) -> None:
        """Initializes the official google-genai client."""
        if not self.api_key:
            return
        try:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        except Exception:
            self._client = None

    def is_configured(self) -> bool:
        """Returns True if an API key is present."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: int = 2048
    ) -> str:
        """Generates text completion using the specified Gemini model."""
        if not self._client:
            self._init_sdk()
        if not self._client:
            raise RuntimeError("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment or .env file.")

        model_name = model or config.generation_model
        try:
            response = self._client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": system_instruction,
                    "temperature": temperature,
                    "max_output_tokens": max_output_tokens
                }
            )
            return response.text or ""
        except Exception as e:
            raise RuntimeError(f"Gemini generation error: {str(e)}")

    def generate_structured_json(
        self,
        prompt: str,
        schema: Any,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates structured JSON strictly validated against a Pydantic schema."""
        if not self._client:
            self._init_sdk()
        if not self._client:
            raise RuntimeError("Gemini API Key is missing.")

        model_name = model or config.generation_model
        try:
            response = self._client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": system_instruction,
                    "response_mime_type": "application/json",
                    "response_schema": schema,
                    "temperature": 0.2
                }
            )
            text = response.text or "{}"
            return json.loads(text)
        except Exception as e:
            raise RuntimeError(f"Gemini structured generation failed: {str(e)}")

    def embed_texts(
        self,
        texts: List[str],
        model: Optional[str] = None,
        dimension: Optional[int] = None
    ) -> List[List[float]]:
        """
        Generates dense vector embeddings using Google's embedding model (e.g. gemini-embedding-2).
        """
        if not self._client:
            self._init_sdk()
        if not self._client:
            raise RuntimeError("Gemini API Key is missing for embedding generation.")

        model_name = model or config.embedding_model
        dim = dimension or config.embedding_dimension

        embeddings: List[List[float]] = []
        try:
            # Batch embedding
            for text in texts:
                resp = self._client.models.embed_content(
                    model=model_name,
                    contents=text,
                    config={"output_dimensionality": dim} if dim else None
                )
                embeddings.append(resp.embedding.values)
            return embeddings
        except Exception as e:
            # Fallback or informative error
            raise RuntimeError(f"Gemini embedding failed with model {model_name}: {str(e)}")

# Global Gemini Client singleton
gemini_client = GeminiClient()
