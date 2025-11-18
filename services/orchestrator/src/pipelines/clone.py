from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import httpx

from ..clients.object_store import ObjectStoreClient
from ..clients.vector import VectorClient
from ..config import get_settings
from ..events.models import CloneJobPayload, CloneJobResult
from .asr import ASRPipeline
from .embeddings import EmbeddingPipeline


class ClonePipeline:
  def __init__(self):
    self.settings = get_settings()
    self.object_store = ObjectStoreClient()
    self.vector_client = VectorClient()
    self.asr = ASRPipeline()
    self.embedder = EmbeddingPipeline()
    self.http = httpx.AsyncClient(timeout=60)

  async def _download_upload(self, upload_key: str) -> Path:
    return self.object_store.download_to_temp(upload_key)

  async def _call_hume(self, transcripts: list[str], payload: CloneJobPayload) -> dict[str, Any]:
    response = await self.http.post(
      'https://api.hume.ai/v0/evi/s2s',
      headers={'X-Hume-Api-Key': self.settings.hume_api_key},
      json={
        'persona': payload.personality_profile,
        'script': transcripts,
        'voiceClone': payload.voice_clone,
        'metadata': {'creatorId': payload.creator_id}
      }
    )
    response.raise_for_status()
    return response.json()

  async def _call_beyond_presence(self, hume_manifest: dict[str, Any], payload: CloneJobPayload) -> dict[str, Any]:
    response = await self.http.post(
      'https://api.beyondpresence.ai/avatar/session',
      headers={'Authorization': f'Bearer {self.settings.beyond_presence_api_key}'},
      json={
        'avatarStyle': payload.avatar_style,
        'phonemes': hume_manifest.get('phonemes'),
        'audioUrl': hume_manifest.get('audioUrl'),
        'persona': payload.personality_profile
      }
    )
    response.raise_for_status()
    return response.json()

  async def _store_artifacts(self, creator_id: str, data: dict[str, Any]) -> str:
    key = f'artifacts/{creator_id}/{data.get("personaId", "default")}.json'
    return self.object_store.upload_json(key, data)

  async def _index_memories(self, creator_id: str, transcripts: list[str]):
    embeddings = self.embedder.embed(transcripts)
    payloads = [{'text': text} for text in transcripts]
    self.vector_client.upsert(creator_id, embeddings, payloads)

  async def run(self, payload: CloneJobPayload) -> CloneJobResult:
    audio_path = await self._download_upload(payload.upload_id)
    try:
      transcripts = await self.asr.transcribe(audio_path)
      hume_manifest = await self._call_hume(transcripts, payload)
      avatar_manifest = await self._call_beyond_presence(hume_manifest, payload)

      artifact_url = await self._store_artifacts(payload.creator_id, avatar_manifest)
      await self._index_memories(payload.creator_id, transcripts)

      return CloneJobResult(
        job_id=payload.job_id,
        creator_id=payload.creator_id,
        tenant_id=payload.tenant_id,
        artifact_url=artifact_url,
        persona_id=avatar_manifest.get('personaId', 'default'),
        model_config=avatar_manifest
      )
    finally:
      try:
        audio_path.unlink()
      except FileNotFoundError:
        pass


async def run_clone_pipeline(payload: CloneJobPayload) -> CloneJobResult:
  pipeline = ClonePipeline()
  return await pipeline.run(payload)
