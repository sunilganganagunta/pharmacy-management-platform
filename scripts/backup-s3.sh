#!/usr/bin/env bash
# ========================================================
# MediCore Automated PostgreSQL S3 Offsite Backup Script
# Performs local AES-256 dump and syncs to private Amazon S3 bucket
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
S3_BUCKET="${S3_BUCKET:-medicore-backups-774697186763}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"

echo "=========================================================="
echo "Starting MediCore Database Backup with S3 Sync: $(date)"
echo "Target Container: ${CONTAINER_NAME}"
echo "Target Database:  ${DB_NAME}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "Target S3 Bucket: ${S3_BUCKET} (${AWS_REGION})"
echo "=========================================================="

# 1. Create secure local backup directory
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

FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
if [ "${FILE_SIZE}" -lt 1024 ]; then
  echo "ERROR: Backup file is suspiciously small (${FILE_SIZE} bytes). Dump may have failed!" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi
echo "Database dump completed: ${BACKUP_FILE} (${FILE_SIZE} bytes)"

# 4. Encrypt with AES-256-CBC
FINAL_UPLOAD_FILE="${BACKUP_FILE}"
if [ -f "${KEY_FILE}" ]; then
  echo "Encrypting backup with AES-256-CBC using ${KEY_FILE}..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "${BACKUP_FILE}" -out "${ENCRYPTED_FILE}" -pass file:"${KEY_FILE}"
  chmod 600 "${ENCRYPTED_FILE}"
  rm -f "${BACKUP_FILE}"
  FINAL_UPLOAD_FILE="${ENCRYPTED_FILE}"
  echo "Backup encrypted: ${ENCRYPTED_FILE}"
else
  echo "WARNING: Key file ${KEY_FILE} not found. Uploading compressed dump with chmod 600."
  chmod 600 "${BACKUP_FILE}"
fi

# 5. Upload to Amazon S3 using EC2 IAM Instance Profile
FILE_BASENAME="$(basename "${FINAL_UPLOAD_FILE}")"
echo "Uploading ${FILE_BASENAME} to s3://${S3_BUCKET}/backups/${FILE_BASENAME}..."

if command -v aws >/dev/null 2>&1; then
  if aws s3 cp "${FINAL_UPLOAD_FILE}" "s3://${S3_BUCKET}/backups/${FILE_BASENAME}" --region "${AWS_REGION}" --sse aws:kms; then
    echo "SUCCESS: Backup uploaded to Amazon S3 with SSE-KMS: s3://${S3_BUCKET}/backups/${FILE_BASENAME}"
  else
    echo "WARNING: AWS S3 copy failed. Local backup is preserved at ${FINAL_UPLOAD_FILE}." >&2
  fi
else
  echo "WARNING: AWS CLI not installed. S3 upload skipped. Local backup preserved."
fi

# 6. Apply local retention policy
echo "Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f \( -name "medicoredb_*.sql.gz" -o -name "medicoredb_*.sql.gz.enc" \) -mtime "+${RETENTION_DAYS}" -exec rm -v {} \;

echo "MediCore Backup & S3 Replication Completed: $(date)"
echo "=========================================================="
