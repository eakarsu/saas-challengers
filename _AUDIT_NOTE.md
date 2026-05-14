# Momentum (saas-challengers) — Audit Note

Last updated: 2026-05-07

## Run

- `./start.sh` — starts backend on port 3012, frontend on 5176, DB `momentum_db`
- Login: `admin@demo.com / demo123`

## Stack

- Backend: Express + pg pool (`backend/db.js`), JWT auth (`backend/middleware/auth.js`)
- Frontend: React + Vite + Tailwind, lucide-react icons, react-router
- AI: OpenRouter via `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` env vars (model defaults to `anthropic/claude-haiku-4.5`)

## Routes overview

### Backend (`backend/routes`)
- `auth.js` — register, login (JWT)
- `projects.js`, `issues.js`, `sprints.js`, `team.js`, `comments.js`, `labels.js` — CRUD
- `ai.js` — AI endpoints (all JWT-protected, all return 503 on missing key)
  - Existing: `sprint-planning`, `issue-triage`, `velocity-analysis`, `project-health`
  - New (2026-05-07): `sprint-risk`, `story-point-estimate`, `similar-issues`, `blocker-classify`, `retro-insights`
- `utils.js` (new 2026-05-07):
  - `GET /api/utils/issues/export.csv` — filtered CSV export
  - `GET /api/utils/search/issues` — text + structured-filter search
  - `GET/POST /api/utils/audit` — audit log
- `dashboard.js` (new 2026-05-07): `GET /api/dashboard/stats` (JWT) — KPI aggregates (active projects, open issues, team members, recent comments, active sprints, weighted sprint progress %), top 5 active sprints, last 15 audit events, status/priority breakdowns

### Frontend (`frontend/src/pages`)
- Existing: ProjectsPage, IssuesPage, SprintsPage, TeamPage, CommentsPage, LabelsPage, AICenterPage, Login
- New (2026-05-07): SearchPage (`/search`), AuditLogPage (`/audit`), SampleDataPage (`/sample-data`), Dashboard (`/dashboard`, default landing)
- `AICenterPage` extended with 5 new tabs
- `Layout.tsx` sidebar: Dashboard is now the first nav item (LayoutDashboard icon)
- `App.tsx`: index route redirects to `/dashboard` (was `/projects`)

### Admin (added 2026-05-07)
- `backend/routes/sample_data.js` mounted at `/api/admin`
- `POST /api/admin/sample-data/:entity` (JWT) for entities: projects, team, labels, sprints, issues, comments. Inserts 5-10 domain-realistic rows. Returns `{inserted, entity}`.
- All sample rows tagged with a `[sample-...]` suffix for easy cleanup.

## Schema

- `users`, `projects`, `labels`, `team_members`, `sprints`, `issues`, `issue_labels`, `comments`
- `audit_log` (added 2026-05-07): `user_email`, `action`, `entity_type`, `entity_id`, `details`, indexed on `created_at desc` and `(entity_type, entity_id)`

## Known caveats

- Without an OpenRouter key, all AI endpoints return HTTP 503; the frontend AICenterPage now displays a clear "AI service unavailable" message instead of "AI unavailable" inline text.
- Pre-existing TypeScript `noUnusedLocals` warnings in `CommentsPage.tsx`, `LabelsPage.tsx`, `TeamPage.tsx` were not touched per "don't modify working code".

## Recent change log

- 2026-05-07: Added 5 AI features + 3 utility features (search, CSV export, audit log). Schema addition (`audit_log`) is idempotent. Full smoke test passed on port 3012. See `/Users/erolakarsu/projects/_AUDIT/apply3_logs/feature_add_saas-challengers.md`.
- 2026-05-07: Added Sample Data admin page + `POST /api/admin/sample-data/:entity` (projects, team, labels, sprints, issues, comments). Smoke-tested all 6 entities returning HTTP 200; rows cleaned up. See `/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_saas-challengers.md`.
- 2026-05-07: Added sample-prefill buttons to all 9 AI tabs in `frontend/src/pages/AICenterPage.tsx` (2-3 samples per tab, 25 total). Samples are tab-aware, inject synthetic Project/Sprint/Issue/Comment rows (IDs >= 900000 to avoid DB collisions) into local state and auto-select dropdowns. No backend changes. Vite production build passes (281 kB JS). See `/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_saas-challengers.md`.
- 2026-05-07: Added Dashboard page (`/dashboard`) as first sidebar item and post-login default landing. Backend: `GET /api/dashboard/stats` (JWT) aggregates KPIs, current active sprints, audit-log activity, and issue breakdowns. Frontend: `pages/Dashboard.tsx` with KPI cards, quick actions (AI Center, Issues, Sprints, Sample Data), sprint progress bars, recent activity feed. Smoke test on port 3012 returned 200 with auth, 401 without; backend cleaned up. See `/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_saas-challengers.md`.
