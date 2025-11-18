from __future__ import annotations

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from ..config import get_settings


class VectorClient:
  def __init__(self):
    settings = get_settings()
    self.client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    self.collection = 'creator_memories'
    self.ensure_collection()

  def ensure_collection(self):
    if self.collection in [col.name for col in self.client.get_collections().collections]:
      return
    self.client.recreate_collection(
      collection_name=self.collection,
      vectors_config=qmodels.VectorParams(size=1536, distance=qmodels.Distance.COSINE)
    )

  def upsert(self, creator_id: str, embeddings: list[list[float]], payloads: list[dict]):
    points = [
      qmodels.PointStruct(id=None, vector=emb, payload={'creatorId': creator_id, **payload})
      for emb, payload in zip(embeddings, payloads, strict=False)
    ]
    self.client.upsert(collection_name=self.collection, points=points)
