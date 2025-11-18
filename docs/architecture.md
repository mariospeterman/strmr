# Architecture Overview

This repository operationalizes the production plan described in `live.plan.md` and the official vendor documentation:

- LiveKit Agents for realtime media pipelines ([docs.livekit.io](https://docs.livekit.io/agents/)).
- Beyond Presence avatar streaming APIs ([docs.bey.dev](https://docs.bey.dev/get-started/api)).
- Hume EVI speech-to-speech streaming ([dev.hume.ai/docs/speech-to-speech-evi](https://dev.hume.ai/docs/speech-to-speech-evi/overview)).
- Stripe Agent Toolkit for usage-based monetization ([docs.stripe.com/agents](https://docs.stripe.com/agents)).

## Subsystems

1. **Core API (`services/api`)** — Multi-tenant auth, creator onboarding, session orchestration, billing, chat/tipping, and webhooks.
2. **Clone & Data Pipelines (`services/orchestrator`)** — Handles dataset ingestion, speech/vision pipelines, avatar packaging, and RAG indexing.
3. **LiveKit Agents (`agents/livekit`)** — Server participants that coordinate STT, LLM, Hume, Beyond Presence, and Stripe usage events.
4. **Clients (`apps/web`, `apps/mobile`)** — LiveKit-enabled fan & creator interfaces with Stripe Elements/Native SDKs.
5. **Infrastructure (`infrastructure`)** — Kubernetes manifests, Terraform modules, observability, and CI/CD definitions.

Each folder contains its own README describing local development tasks and how it maps to the overall system diagram.
