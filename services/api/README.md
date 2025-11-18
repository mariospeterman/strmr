# Core API Service

Fastify-based multi-tenant backend responsible for:

- Authentication & identity (OAuth-compatible JWTs, creator KYC hooks).
- Tenant, creator, and catalog management.
- Session orchestration (LiveKit room provisioning, policy enforcement).
- Billing + metering via Stripe AgentKit, plus Stripe webhook ingestion.
- Chat/tipping WebSocket relay and moderation fanouts.
- Internal agent + orchestration callbacks.

This service is aligned with LiveKit Agents best practices and integrates the provider SDKs documented in:

- LiveKit Agents server SDK ([docs.livekit.io](https://docs.livekit.io/agents/)).
- Stripe Agent Toolkit ([docs.stripe.com/agents](https://docs.stripe.com/agents)).

## Local development

```bash
pnpm install
pnpm dev
```

Environment variables come from `.env`. See `src/config/env.ts` for the full contract.
