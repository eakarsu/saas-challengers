# PostgreSQL backup and restore

Backups belong in encrypted operator-controlled storage outside the repository. Use a least-privileged backup identity:

```bash
DATABASE_URL='postgresql://...' \
BACKUP_OUTPUT_DIR='/absolute/operator/backup/path' \
./scripts/backup-postgres.sh
```

The script writes a PostgreSQL custom-format dump with restrictive permissions and a SHA-256 manifest. Apply deployment-specific encryption, replication, monitoring, retention, residency, deletion, and legal-hold policy.

For a restore drill, create a new isolated database whose name starts with `saas_challengers_restore_verify_`; never target development, staging, production, or a shared test database. Verify the manifest and run:

```bash
ALLOW_DISPOSABLE_RESTORE=YES \
RESTORE_DATABASE_URL='postgresql://.../saas_challengers_restore_verify_2026q3' \
BACKUP_FILE='/absolute/operator/backup/path/saas-challengers-....dump' \
./scripts/verify-restore.sh
```

Then run `npm run migrate:check --prefix backend`, backend tests against the isolated restore, sample tenant/audit-chain checks, and record dump age, row evidence, restore duration, RPO/RTO comparison, reviewer, and disposal. The script never creates or drops a database.
