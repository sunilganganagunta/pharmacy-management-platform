#!/usr/bin/env bash
# ========================================================
# MediCore Database Restore Script
# Restores from compressed or AES-256 encrypted pg_dump backup
# ========================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
TARGET_DB="${2:-medicoredb}"
CONTAINER_NAME="${CONTAINER_NAME:-medicore-prod-postgres}"
DB_USER="${DB_USER:-medicore_user}"
KEY_FILE="${KEY_FILE:-/etc/medicore/backup.key}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup-file.sql.gz[.enc]> [target_database_name]"
  echo "Example: $0 /var/backups/medicore/medicoredb_20261112.sql.gz.enc medicore_restore_test"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file '${BACKUP_FILE}' does not exist!" >&2
  exit 1
fi

echo "=========================================================="
echo "Starting MediCore Database Restore: $(date)"
echo "Source File:      ${BACKUP_FILE}"
echo "Target Container: ${CONTAINER_NAME}"
echo "Target Database:  ${TARGET_DB}"
echo "=========================================================="

# Ensure target database exists
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" | grep -q 1 || \
  docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${TARGET_DB};"

TEMP_DECRYPT="/tmp/restore_temp_$(date +%s).sql.gz"

# Decrypt if encrypted
if [[ "${BACKUP_FILE}" == *.enc ]]; then
  if [ ! -f "${KEY_FILE}" ]; then
    echo "ERROR: Key file '${KEY_FILE}' required to decrypt ${BACKUP_FILE}!" >&2
    exit 1
  fi
  echo "Decrypting ${BACKUP_FILE}..."
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in "${BACKUP_FILE}" -out "${TEMP_DECRYPT}" -pass file:"${KEY_FILE}"
  RESTORE_SRC="${TEMP_DECRYPT}"
else
  RESTORE_SRC="${BACKUP_FILE}"
fi

# Restore into target database
echo "Decompressing and piping SQL stream into ${TARGET_DB}..."
gunzip -c "${RESTORE_SRC}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${TARGET_DB}" -q

# Clean up temporary decrypted file
if [ -f "${TEMP_DECRYPT}" ]; then
  rm -f "${TEMP_DECRYPT}"
fi

echo "Database restore completed successfully into ${TARGET_DB}!"
echo "Verifying restored tables..."
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${TARGET_DB}" -c "\dt"

echo "=========================================================="
