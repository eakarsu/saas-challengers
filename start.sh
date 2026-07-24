#!/usr/bin/env bash
set -euo pipefail

# Local demo credential bridge (managed by tools/fix_demo_autofill.mjs)
demo_credentials_project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if [ -f "$demo_credentials_project_dir/.env" ]; then
  while IFS= read -r demo_credentials_line || [ -n "$demo_credentials_line" ]; do
    case "$demo_credentials_line" in ''|'#'*) continue ;; esac
    demo_credentials_line="${demo_credentials_line#export }"
    demo_credentials_key="${demo_credentials_line%%=*}"
    demo_credentials_value="${demo_credentials_line#*=}"
    case "$demo_credentials_key" in
      NODE_ENV|ENABLE_DEMO_CREDENTIAL_AUTOFILL|DEMO_EMAIL|DEMO_PASSWORD|SEED_ADMIN_EMAIL|SEED_ADMIN_PASSWORD|ADMIN_EMAIL|ADMIN_PASSWORD|DEFAULT_EMAIL|DEFAULT_PASSWORD) ;;
      *) continue ;;
    esac
    [ -n "${!demo_credentials_key+x}" ] && continue
    demo_credentials_first="${demo_credentials_value:0:1}"
    demo_credentials_last="${demo_credentials_value: -1}"
    if { [ "$demo_credentials_first" = '"' ] && [ "$demo_credentials_last" = '"' ]; } || { [ "$demo_credentials_first" = "'" ] && [ "$demo_credentials_last" = "'" ]; }; then
      demo_credentials_value="${demo_credentials_value:1:${#demo_credentials_value}-2}"
    fi
    export "$demo_credentials_key=$demo_credentials_value"
  done < "$demo_credentials_project_dir/.env"
fi
demo_credentials_email=""
demo_credentials_password=""
if [ -n "${DEMO_EMAIL:-}" ] && [ -n "${DEMO_PASSWORD:-}" ]; then
  demo_credentials_email="$DEMO_EMAIL"
  demo_credentials_password="$DEMO_PASSWORD"
elif [ -n "${SEED_ADMIN_EMAIL:-}" ] && [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
  demo_credentials_email="$SEED_ADMIN_EMAIL"
  demo_credentials_password="$SEED_ADMIN_PASSWORD"
elif [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  demo_credentials_email="$ADMIN_EMAIL"
  demo_credentials_password="$ADMIN_PASSWORD"
elif [ -n "${DEFAULT_EMAIL:-}" ] && [ -n "${DEFAULT_PASSWORD:-}" ]; then
  demo_credentials_email="$DEFAULT_EMAIL"
  demo_credentials_password="$DEFAULT_PASSWORD"
fi
if [ "${NODE_ENV:-development}" != production ] && [ "${ENABLE_DEMO_CREDENTIAL_AUTOFILL:-true}" = true ] && [ -n "$demo_credentials_email" ] && [ -n "$demo_credentials_password" ]; then
  export VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL=true
  export VITE_DEMO_EMAIL="$demo_credentials_email"
  export VITE_DEMO_PASSWORD="$demo_credentials_password"
  export REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL=true
  export REACT_APP_DEMO_EMAIL="$demo_credentials_email"
  export REACT_APP_DEMO_PASSWORD="$demo_credentials_password"
  export NEXT_PUBLIC_ENABLE_DEMO_CREDENTIAL_AUTOFILL=true
  export NEXT_PUBLIC_DEMO_EMAIL="$demo_credentials_email"
  export NEXT_PUBLIC_DEMO_PASSWORD="$demo_credentials_password"
else
  export VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL=false
  export REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL=false
  export NEXT_PUBLIC_ENABLE_DEMO_CREDENTIAL_AUTOFILL=false
  unset VITE_DEMO_EMAIL VITE_DEMO_PASSWORD REACT_APP_DEMO_EMAIL REACT_APP_DEMO_PASSWORD NEXT_PUBLIC_DEMO_EMAIL NEXT_PUBLIC_DEMO_PASSWORD
fi
unset demo_credentials_email demo_credentials_password demo_credentials_project_dir demo_credentials_line demo_credentials_key demo_credentials_value demo_credentials_first demo_credentials_last

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
