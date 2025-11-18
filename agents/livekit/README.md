# LiveKit Agent Runtime

Implements the LiveKit Agents participant responsible for:

- Subscribing to room audio/data tracks and streaming transcripts to the LLM stack.
- Driving persona-grounded responses using RAG memories from Qdrant.
- Sending text to Hume EVI for speech-to-speech audio + phoneme timings.
- Forwarding phonemes/emotion vectors to the Beyond Presence avatar session.
- Publishing audio/video tracks back to the LiveKit room.
- Emitting usage metrics to Stripe AgentKit.

The implementation follows LiveKit's official Agents docs and Beyond Presence plugin guidance.

## Running locally

```bash
poetry install
poetry run python -m src.agent_runner --room demo-room --creator-id demo
```

Environment variables are consumed via `.env` (see root template).
