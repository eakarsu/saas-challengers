# Governed challenger research

This repository now exposes one bounded product workflow for competitive-research teams: an analyst records a SaaS displacement hypothesis and cost inputs, attaches attributable evidence, receives a deterministic versioned score, and submits it to a different reviewer for an approve/reject decision. PostgreSQL persists tenant membership, optimistic versions, evidence hashes, workflow state, and an immutable per-organization audit chain.

Generated project-management, generic AI, mock-data, sample-seed, and gap routes remain only as historical source and are not mounted by the server or frontend.

## Local preparation

Requirements are Node.js 20+, PostgreSQL 14+, and PostgreSQL client tools for backup drills.

```bash
cp .env.example .env
# set a dedicated DATABASE_URL and random JWT_SECRET
npm ci --prefix backend
npm ci --prefix frontend
npm run migrate --prefix backend
npm run migrate:check --prefix backend
npm test --prefix backend
npm run build --prefix frontend
./start.sh
```

Startup never installs packages, creates a database, applies migrations, seeds data, or terminates unrelated processes. It requires a prepared schema and existing frontend build, binds to loopback, and serves both the API and frontend from one process.

## Acceptance criteria

- A new user creates an organization; an admin issues one-time 24-hour analyst/reviewer invitations.
- Every protected request resolves an active organization membership and role from PostgreSQL using `X-Organization-ID`; cross-tenant IDs return not found.
- An analyst can create an idempotent draft, attach credential-free HTTPS evidence, and submit only with a matching optimistic version and at least one evidence item.
- Cost, labor savings, confidence adjustment, payback, and recommendation use deterministic integer arithmetic identified as `cost-v1`; no LLM or external provider determines the decision.
- Only a different admin/reviewer can decide an in-review assessment. Submitted inputs/evidence and final decisions are database-protected; every material change appends to a hash chain whose export is recomputed and verified.
- Migrations, unit/integration/failure tests, frontend build, low-threshold dependency audits, container build, and current/history secret scanning gate releases.

See `docs/OPERATIONS_RUNBOOK.md`, `docs/SECURITY_BOUNDARY.md`, and `docs/BACKUP_RESTORE_RUNBOOK.md` before staging or production use.
