from __future__ import annotations

import asyncio

from .celery_app import celery_app
from ..events.models import CloneJobPayload
from ..pipelines.clone import run_clone_pipeline


@celery_app.task(name="clone.build")
def build_clone_job(job_payload: dict) -> dict:
    payload = CloneJobPayload(**job_payload)
    result = asyncio.run(run_clone_pipeline(payload))
    return result.model_dump()
