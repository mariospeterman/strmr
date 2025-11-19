from fastapi import FastAPI
from pydantic import BaseModel
from celery.result import AsyncResult

from .workers.celery_app import celery_app
from .workers.clone_tasks import build_clone_job

app = FastAPI(title="strmr.ai Orchestrator", version="0.1.0")


class CloneRequest(BaseModel):
    job_id: str
    creator_id: str
    tenant_id: str
    dataset_key: str
    hume_voice_id: str | None = None
    beyond_presence_avatar_id: str | None = None
    persona: dict | None = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/jobs/clone")
def enqueue_clone_job(request: CloneRequest) -> dict:
    task = build_clone_job.delay(request.model_dump())
    return {"task_id": task.id}


@app.get("/jobs/{task_id}")
def get_job_status(task_id: str) -> dict:
    result = AsyncResult(task_id, app=celery_app)
    payload: dict = {"task_id": task_id, "status": result.status.lower()}
    if result.successful():
        payload["result"] = result.result
    elif result.failed():
        payload["error"] = str(result.result)
    return payload
