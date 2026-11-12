#!/usr/bin/env bash
# ========================================================
# MediCore Automated PostgreSQL Backup Script
# Performs pg_dump, gzip compression, AES-256 encryption & retention
# ========================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/medicore}"
CONTAINER_NAME="${CONTAINER_NAME:-medicore-prod-postgres}"
DB_NAME="${DB_NAME:-medicoredb}"
DB_USER="${DB_USER:-medicore_user}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/medicoredb_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"
KEY_FILE="${KEY_FILE:-/etc/medicore/backup.key}"

echo "=========================================================="
echo "Starting MediCore Database Backup: $(date)"
echo "Target Container: ${CONTAINER_NAME}"
echo "Target Database:  ${DB_NAME}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "=========================================================="

# 1. Create secure backup directory
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# 2. Verify PostgreSQL container is running
if ! docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
  echo "ERROR: PostgreSQL container '${CONTAINER_NAME}' is not running!" >&2
  exit 1
fi

# 3. Dump database and compress with gzip
echo "Exporting database dump via pg_dump..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

# Verify dump file size
FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
if [ "${FILE_SIZE}" -lt 1024 ]; then
  echo "ERROR: Backup file is suspiciously small (${FILE_SIZE} bytes). Dump may have failed!" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi
echo "Database dump completed: ${BACKUP_FILE} (${FILE_SIZE} bytes)"

# 4. Encrypt with AES-256-CBC if key file exists
if [ -f "${KEY_FILE}" ]; then
  echo "Encrypting backup with AES-256-CBC using ${KEY_FILE}..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "${BACKUP_FILE}" -out "${ENCRYPTED_FILE}" -pass file:"${KEY_FILE}"
  chmod 600 "${ENCRYPTED_FILE}"
  rm -f "${BACKUP_FILE}" # Securely remove plaintext compressed dump
  echo "Backup encrypted: ${ENCRYPTED_FILE}"
else
  echo "WARNING: Key file ${KEY_FILE} not found. Keeping compressed dump unencrypted with chmod 600."
  chmod 600 "${BACKUP_FILE}"
fi

# 5. Apply retention policy (delete backups older than RETENTION_DAYS)
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f \( -name "medicoredb_*.sql.gz" -o -name "medicoredb_*.sql.gz.enc" \) -mtime "+${RETENTION_DAYS}" -exec rm -v {} \;

echo "MediCore Database Backup Finished Successfully: $(date)"
echo "=========================================================="
