#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "${project_dir}"

env_file="${ENV_FILE:-.env}"
if [[ ! -f "${env_file}" ]]; then echo "Missing ${env_file}; copy .env.example and provide operator values." >&2; exit 2; fi
set -a
source "${env_file}"
set +a

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${PROVISION_ADMIN_EMAIL:?PROVISION_ADMIN_EMAIL is required}"
: "${PROVISION_ADMIN_PASSWORD:?PROVISION_ADMIN_PASSWORD is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
[[ "${OPENROUTER_BASE_URL:-}" == "https://openrouter.ai/api/v1" ]] || { echo "OPENROUTER_BASE_URL must be canonical." >&2; exit 2; }
if [[ ${#JWT_SECRET} -lt 32 ]]; then echo "JWT_SECRET must contain at least 32 characters." >&2; exit 2; fi
if [[ "${JWT_SECRET}" =~ (generate[-_\ ]?(a|an)|replace[-_\ ]?me|change[-_\ ]?me|changeme|example[-_\ ]?secret) ]]; then echo "JWT_SECRET must be generated and cannot use an example placeholder." >&2; exit 2; fi
if [[ "${DATABASE_URL}" =~ (replace[-_\ ]?me|change[-_\ ]?me|changeme) ]]; then echo "DATABASE_URL cannot contain an example placeholder." >&2; exit 2; fi
if [[ ! -d backend/node_modules || ! -d frontend/node_modules || ! -f frontend/dist/index.html ]]; then echo "Install dependencies and build the frontend before startup." >&2; exit 2; fi

app_port="${PORT:-3012}"
ui_port="${FRONTEND_PORT:?FRONTEND_PORT is required}"
if [[ "$app_port" == "$ui_port" ]]; then echo "API and UI ports must be distinct." >&2; exit 2; fi
for assigned_port in "$app_port" "$ui_port"; do
  if lsof -nP -iTCP:"${assigned_port}" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port ${assigned_port} is already occupied; refusing to stop another process." >&2; exit 2; fi
done

node backend/db/migrate.js
npm --prefix backend run create-admin
DATABASE_URL="${DATABASE_URL}" JWT_SECRET="${JWT_SECRET}" node -e "const pool=require('./backend/db'); pool.query('SELECT COUNT(*) FROM schema_migrations').then(()=>pool.end()).catch((error)=>{console.error('Database is not migrated:', error.message); process.exit(2)})"

export HOST=127.0.0.1
export FRONTEND_DIST="${project_dir}/frontend/dist"
node backend/server.js &
backend_pid=$!
npm --prefix frontend run preview -- --host 127.0.0.1 --port "$ui_port" --strictPort &
frontend_pid=$!

cleanup() {
  if kill -0 "${backend_pid}" 2>/dev/null; then kill -TERM "${backend_pid}"; wait "${backend_pid}" || true; fi
  if kill -0 "${frontend_pid}" 2>/dev/null; then kill -TERM "${frontend_pid}"; wait "${frontend_pid}" || true; fi
}
trap cleanup EXIT INT TERM

for _attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:${app_port}/api/health" >/dev/null && curl --fail --silent "http://127.0.0.1:${ui_port}/" >/dev/null; then
    echo "Governed research is ready: API ${app_port}, UI ${ui_port}"
    wait "${backend_pid}"
    exit $?
  fi
  if ! kill -0 "${backend_pid}" 2>/dev/null; then echo "Backend exited during readiness checks." >&2; exit 1; fi
  sleep 1
done
echo "Backend did not become ready." >&2
exit 1
