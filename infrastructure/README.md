# Infrastructure

Contains Kubernetes manifests and Terraform modules aligned with the production plan.

- `k8s/` — manifests for API, orchestrator worker, agent runtime, and supporting data stores.
- `terraform/` — AWS reference architecture (VPC, EKS, RDS, secrets, LiveKit + Stripe secrets wiring).

## Local dev stack

Use `k8s/dev-compose.yaml` to run Postgres, Redis, Kafka, and MinIO locally when iterating on services.
