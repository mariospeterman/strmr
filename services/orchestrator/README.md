# Clone & Data Orchestrator

Celery-based worker responsible for ingesting creator datasets, generating voice/visual clones, running embeddings, and dispatching lifecycle events to the platform bus.

Key responsibilities:

- Pull ingestion jobs from Kafka/Redis queues.
- Run ASR, diarization, transcription cleanup, and persona extraction.
- Call Hume EVI + Beyond Presence packaging endpoints.
- Write artifacts to S3-compatible object storage and register metadata with the core API.
- Feed embeddings into Qdrant for RAG memory.

## Commands

```bash
poetry install
poetry run celery -A src.worker.celery_app worker -l info
poetry run uvicorn src.api:app --reload
```

The FastAPI surface (`src/api.py`) provides health checks and manual job submission endpoints for ops teams.
