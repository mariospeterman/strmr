# strmr.ai — Live AI Avatar Platform

Production-ready mono-repo that stitches together LiveKit Agents, Beyond Presence avatars, Hume EVI speech-to-speech, and Stripe AgentKit for a multi-tenant AI influencer streaming product.

## Repository layout

- `apps/` — user-facing web/mobile clients built with LiveKit client SDKs and Stripe Elements.
- `services/` — TypeScript + Python backend services (core API + clone/orchestration).
- `agents/` — LiveKit Agent runtime packages that orchestrate LLM, Hume, and avatar streams.
- `infrastructure/` — Kubernetes manifests and Terraform modules for cloud deployment.
- `docs/` — architecture notes and runbooks.

## Tooling

- **JavaScript/TypeScript:** pnpm workspace + shared `tsconfig.base.json` + Turbo repo tasks.
- **Python:** Poetry-managed dependencies for orchestrators and agents.
- **CI/CD:** GitHub Actions templates for lint/test/build plus IaC validation.

## Getting started (local)

1. Copy `.env.example` to `.env` and fill in LiveKit, Hume, Beyond Presence, and Stripe secrets.
2. Install pnpm (>=8) and Poetry (>=1.8).
3. Run `pnpm install` at the repo root to bootstrap JS workspaces.
4. Run `poetry install` inside `services/orchestrator` and `agents/livekit` for Python deps.
5. Launch supporting services (Postgres, Redis, Kafka, MinIO) via `docker compose -f infrastructure/k8s/dev-compose.yaml up` (file stub forthcoming).

Refer to `docs/architecture.md` for subsystem specs and to the official vendor docs linked there for API semantics.
