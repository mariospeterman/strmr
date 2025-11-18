from __future__ import annotations

from typing import List

from openai import OpenAI

from ..config import get_settings


class EmbeddingPipeline:
    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for embeddings")
        self.client = OpenAI(api_key=self.settings.openai_api_key)

    def embed(self, texts: List[str]) -> List[List[float]]:
        response = self.client.embeddings.create(model="text-embedding-3-large", input=texts)
        return [item.embedding for item in response.data]
