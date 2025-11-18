from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class CloneJobPayload(BaseModel):
  job_id: str
  creator_id: str
  tenant_id: str
  upload_id: str
  avatar_style: str
  voice_clone: bool = True
  personality_profile: str | None = None


class CloneJobResult(BaseModel):
  job_id: str
  creator_id: str
  tenant_id: str
  artifact_url: str
  persona_id: str
  model_config: dict
  completed_at: datetime = Field(default_factory=datetime.utcnow)
  status: Literal["ready", "failed"] = "ready"
  error: str | None = None
