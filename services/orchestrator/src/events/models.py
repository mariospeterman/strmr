from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional, Dict, Any
from pydantic import BaseModel, Field


class CloneJobPayload(BaseModel):
  job_id: str
  creator_id: str
  tenant_id: str
  dataset_key: str
  hume_voice_id: Optional[str] = None
  beyond_presence_avatar_id: Optional[str] = None
  persona: Optional[Dict[str, Any]] = None


class CloneJobResult(BaseModel):
  job_id: str
  creator_id: str
  tenant_id: str
  dataset_key: str
  artifact_url: str
  persona_id: str
  model_config: dict
  completed_at: datetime = Field(default_factory=datetime.utcnow)
  status: Literal["ready", "failed"] = "ready"
  error: Optional[str] = None
