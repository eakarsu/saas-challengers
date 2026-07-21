#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ -z "${DATABASE_URL:-}" || -z "${BACKUP_OUTPUT_DIR:-}" ]]; then echo "DATABASE_URL and BACKUP_OUTPUT_DIR are required." >&2; exit 2; fi
if [[ "${BACKUP_OUTPUT_DIR}" != /* || "${BACKUP_OUTPUT_DIR}" == "/" ]]; then echo "BACKUP_OUTPUT_DIR must be a specific absolute directory outside the repository." >&2; exit 2; fi
mkdir -p -- "${BACKUP_OUTPUT_DIR}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${BACKUP_OUTPUT_DIR}/saas-challengers-${timestamp}.dump"
partial_path="${backup_path}.partial"
trap 'rm -f -- "${partial_path}"' EXIT
pg_dump --dbname="${DATABASE_URL}" --format=custom --no-owner --no-privileges --file="${partial_path}"
mv -- "${partial_path}" "${backup_path}"
trap - EXIT
if command -v sha256sum >/dev/null 2>&1; then sha256sum "${backup_path}" > "${backup_path}.sha256"; else shasum -a 256 "${backup_path}" > "${backup_path}.sha256"; fi
echo "Backup and SHA-256 manifest created in the operator-controlled directory."
