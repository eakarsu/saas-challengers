# Governed research operations runbook

## Release

1. Provision an isolated PostgreSQL database. Use a controlled migration identity for schema changes and a least-privileged runtime identity afterward. Supply `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, exact CORS origins, and TLS at the ingress.
2. Run reproducible installs, `npm run migrate --prefix backend`, then `npm run migrate:check --prefix backend`. Application startup never mutates schema or data. Leave `TRUST_PROXY=false` for direct access; enable it only behind an operator-controlled proxy that overwrites forwarded headers.
3. Run backend tests, frontend build, low-threshold audits, the container build, and full current/history secret scanning. Review migration checksum changes rather than modifying an applied migration.
4. Create the initial organization through registration. Record the resulting administrator, invite analysts and independent reviewers using one-time tokens, and verify that invitation tokens are delivered only through an approved private channel.
5. Exercise one draft→evidence→submit→independent decision workflow. Verify the expected `cost-v1` score, `verification.valid=true` in the audit export, tenant isolation, and `/api/research/operations` counts.
6. Start with `./start.sh` for loopback operation or the checked-in container with `HOST=0.0.0.0` behind TLS. Confirm `/api/health` and retain request-ID-aware logs without request bodies or authorization headers.

## Failure and retry

- Create is idempotent per organization. Retry the same key and identical body after connection uncertainty; changed input under the key returns `IDEMPOTENCY_CONFLICT`.
- Evidence, submit, and decision require the last observed `version`. A `VERSION_CONFLICT` means refresh; do not overwrite another actor's work.
- PostgreSQL serialization conflict returns `SERIALIZATION_RETRY`; retry the same idempotent action. Do not convert it to a new assessment.
- Evidence cannot be added after submission. Return to the analyst by rejecting with a reason and create a new assessment version; finalized evidence is never edited in place.
- A stale in-review count is visible after 48 hours. Operators should notify an independent reviewer; they must not impersonate or bypass self-review controls.
- Database unavailable health is HTTP 503. Stop accepting writes, restore connectivity, and verify migration status/audit sequence before reopening.

## Observability and retention

Application logs contain request ID, method, path, status, and duration only. Alert on authentication throttling, 5xx rates, database-unavailable health, serialisation retries, stale reviews, and sudden audit-sequence gaps. The deployment owner must set evidence/audit retention, privacy review, data residency, legal hold, deletion, and backup RPO/RTO policies; repository defaults cannot determine them.
