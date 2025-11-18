from fastapi import FastAPI
from pydantic import BaseModel

from .workers.clone_tasks import build_clone_job

app = FastAPI(title="strmr.ai Orchestrator", version="0.1.0")


class CloneRequest(BaseModel):
    job_id: str
    creator_id: str
    tenant_id: str
    upload_id: str
    avatar_style: str
    voice_clone: bool = True
    personality_profile: str | None = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/jobs/clone")
def enqueue_clone_job(request: CloneRequest) -> dict:
    task = build_clone_job.delay(request.model_dump())
    return {"task_id": task.id}
