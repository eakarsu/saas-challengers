# Completeness Review: saas-challengers

**Original review date:** 2026-07-18  
**Implementation verification date:** 2026-07-20

## Assessment basis

The original static review classified a 94-source-file generated prototype with generic AI, mock/sample/gap routes, destructive startup behavior, no project-owned tests, and no CI. The 2026-07-20 remediation deliberately narrows the executable product to one durable workflow. Verification included clean dependency installs, migration apply/check on disposable PostgreSQL, persistent API integration tests, frontend compilation, production-mode startup, backup/restore, dependency audits, and Gitleaks scans of both the current directory and all Git history.

## Classification

**Bounded MVP implemented; production release remains externally gated.**

The executable application is now a governed competitive-research register: an analyst creates an incumbent-versus-challenger assessment, attaches attributable evidence, obtains a deterministic `cost-v1` economic score, and submits it to a different reviewer for an immutable decision. Generated project-management, sample, gap, and generic-AI code remains historical source only; the server and frontend do not mount it.

This is not classified as fully production-complete because deployment-specific identity, infrastructure, privacy, recovery objectives, penetration testing, and human browser acceptance require operator or external-system evidence.

## Original needed features and disposition

1. **Define the primary user and acceptance criteria, then complete one end-to-end workflow against persistent data instead of demo fixtures — implemented.** Analysts and independent reviewers are named users; acceptance criteria are in `README.md`. PostgreSQL persists tenant membership, drafts, cost inputs, versioned evidence, score, decisions, and audit evidence.
2. **Replace mocks, placeholders, and generic AI responses with validated domain services and explicit failure/retry behavior — implemented for the bounded workflow; unrelated generated features archived from execution.** Recommendation is deterministic integer arithmetic with safe-range checks and a version. Idempotency, optimistic concurrency, serialization-retry guidance, evidence locking, and database-unavailable behavior are explicit. No LLM provider is invoked.
3. **Implement secure identity, role/tenant boundaries, input validation, secrets handling, and auditable state changes — implemented at repository scope.** Bcrypt credentials, 15-minute signed access tokens, active membership lookup on every request, admin/analyst/reviewer authorization, tenant-scoped queries/FKs, bounded inputs, one-time hashed invitations, database immutability triggers, and a recomputed per-organization audit hash chain are present. `.env` is ignored and untracked.
4. **Add representative automated tests, CI quality gates, environment documentation, migrations, observability, backup, and deployment configuration — implemented.** The repository includes checksum-tracked migrations, request-ID structured logs, health/operations endpoints, guarded backup/restore scripts, runbooks, a non-root multi-stage container, and CI gates for migrations, tests, builds, low-threshold audits, container build, and full-history Gitleaks.
5. **Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage — implemented for the bounded workflow.** Sixteen backend tests cover scoring boundaries, identity/invitations, tenant isolation, idempotency, validation, optimistic conflicts, evidence hashing/locking, missing evidence, deterministic score output, self-review denial, immutable final state, audit-chain verification/tamper rejection, safe startup, and retired route 404s. Fresh and restored migrations were separately exercised.

## Implementation progress (2026-07-20)

- Replaced the executable product surface with `/api/auth` and `/api/research` plus a single `ResearchWorkflow` frontend. Legacy AI, seed, gap, and CRUD routes return 404 and are absent from mounted route configuration.
- Added organization membership, invitation, assessment, evidence, and audit schemas with composite tenant constraints, check constraints, optimistic versions, idempotency request hashes, valid-state-transition triggers, and submitted/final immutability.
- Added deterministic `cost-v1` scoring for labor savings, gross annual savings, first-year benefit, confidence adjustment, payback, and recommendation using integer/BigInt arithmetic.
- Added an independent-review state machine: the creator cannot approve or reject their own work, evidence locks at submission, and final decisions are immutable.
- Added SHA-256 evidence fingerprints and serialized audit appends. Audit export verification recomputes every event hash, previous-hash link, and sequence.
- Hardened runtime behavior with Helmet, exact-origin CORS, bounded JSON, authentication throttling, non-sensitive structured logs, request IDs, safe errors, explicit proxy trust, loopback defaults, and graceful shutdown.
- Replaced destructive startup behavior. `start.sh` never installs, creates a database, migrates, seeds, kills processes, or overwrites an occupied port; it requires a prepared database/build.
- Added `.env.example`, operator/security/backup runbooks, guarded backup/restore tooling, a multi-stage non-root Dockerfile, and GitHub Actions CI.
- Updated vulnerable backend/frontend dependencies. Backend and frontend `npm audit --audit-level=low` each report zero vulnerabilities.
- Independent handoff hardening made CI database/JWT material unique per run and made both the launcher and backend reject long example JWT/database placeholders, not merely undersized secrets.

## Verification evidence

- Collision gate before editing: no recent project writes, project process, or open handle from another actor; no `AGENTS.md` applied.
- Backend syntax: every project-owned backend JavaScript file passed `node --check`.
- Migration: a new disposable database reported `{"applied":1,"newlyApplied":1}`, then `{"applied":1,"pending":0}`; seven required schema tables were present.
- Automated tests: `npm test --prefix backend` passed **16/16**, including durable PostgreSQL workflow and failure paths.
- Frontend: clean `npm ci` followed by TypeScript and Vite 8.1.5 production build passed.
- Dependency audits: backend **0** and frontend **0** findings at the low threshold.
- Runtime: production-mode `/api/health` returned 200 with a reachable database, `/` served the built frontend, the retired AI endpoint returned 404, and SIGINT released the test port.
- Recovery: a custom-format PostgreSQL backup and SHA-256 manifest were created outside the repository, the manifest verified, the dump restored into a guarded disposable database, migration check passed, and durable workflow/audit rows were present.
- Secrets: Gitleaks 8.30.1 reported **0 current-directory findings** and **0 full-history findings**. `.env` is ignored, untracked, and absent from Git history.
- Startup scripts passed `bash -n`; executable bits are set on launcher and operational scripts.

## Remaining external release gates

- The preserved local `.env` fails the new JWT minimum-length guard. An operator must set a random 32+ character secret in an approved secret manager; no value was printed or changed during review.
- The local Docker build could not execute because the configured Colima daemon was stopped. CI contains the build gate, but a successful CI/container evidence record is still required.
- The in-app browser runtime exposed no browser instance, so visual/responsive/accessibility and human acceptance checks remain required even though compilation and HTTP serving passed.
- Provision TLS/ingress, explicit `TRUST_PROXY` behavior, PostgreSQL TLS, separate migration/runtime roles and grants, centralized logs/alerts, dependency/base-image monitoring, and a retained deployment environment.
- Establish private invitation delivery, account recovery, MFA/SSO requirements, secret rotation, incident response, privacy/data-residency/retention/deletion policy, and evidence licensing review.
- Run a penetration test and authorization review, define production RPO/RTO, retain scheduled encrypted backups, and complete a timed restore drill under the operator's actual storage/network controls.

## Risk disposition

- **Credential/configuration exposure:** repository and history scans are clean; local ignored configuration still requires operator-strength replacement before launch.
- **Destructive automation:** removed from startup. Migration and restore are explicit operator commands; restore requires an allow flag and a disposable database-name prefix.
- **Startup mutation:** removed. Startup performs only a read-only migration-table check and refuses unprepared state.
- **AI availability/privacy/prompt injection:** removed from the executable workflow because no external model is called. Residual source is unmounted historical code.

## Evidence inspected

- `README.md`, `.env.example`, `.github/workflows/ci.yml`, `Dockerfile`, `start.sh`
- `backend/config.js`, `backend/server.js`, `backend/middleware/auth.js`, `backend/routes/auth.js`, `backend/routes/research.js`
- `backend/services/scoring.js`, `backend/services/audit.js`, `backend/db/migrate.js`, `backend/db/migrations/001_governed_research.sql`
- `backend/tests/scoring.test.js`, `backend/tests/workflow.test.js`, `backend/tests/safety.test.js`
- `frontend/src/App.tsx`, `frontend/src/api.ts`, `frontend/src/pages/ResearchWorkflow.tsx`
- `docs/OPERATIONS_RUNBOOK.md`, `docs/SECURITY_BOUNDARY.md`, `docs/BACKUP_RESTORE_RUNBOOK.md`

## Recommended next action

Run the checked-in CI in a clean GitHub context, then deploy to an isolated staging environment and close the listed external gates with retained container, browser acceptance, security, monitoring, and timed restore evidence before authorizing production traffic.

### Runtime acceptance follow-up (2026-07-20)

- Added an explicit administrator bootstrap that creates a bcrypt-backed PostgreSQL user, organization, and active `ADMIN` membership without embedding credentials. Added `/api/auth/session` to revalidate the signed access token against the active user and memberships.
- The first recorded run passed on its unique allocation—PostgreSQL `55692`, API `6184`, UI allocation `6185`—and `_runtime_non_suite_repair_shard2p.tsv` records `API_VERIFIED / startup_login_session_api`.
