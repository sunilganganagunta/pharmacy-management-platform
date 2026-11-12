#!/usr/bin/env bash
set -e

echo "=== Step 1: Create Directories and Encryption Key ==="
sudo mkdir -p /etc/medicore /opt/medicore/scripts /var/backups/medicore
if [ ! -f /etc/medicore/backup.key ]; then
  openssl rand -base64 32 | sudo tee /etc/medicore/backup.key > /dev/null
  sudo chmod 600 /etc/medicore/backup.key
fi

echo "=== Step 2: Install Backup and Restore Scripts ==="
cat << 'EOF' | sudo tee /opt/medicore/scripts/backup.sh > /dev/null
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-/var/backups/medicore}"
CONTAINER_NAME="medicore-prod-postgres"
DB_NAME="medicoredb"
DB_USER="medicore_user"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/medicoredb_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"
KEY_FILE="/etc/medicore/backup.key"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "${BACKUP_FILE}" -out "${ENCRYPTED_FILE}" -pass file:"${KEY_FILE}"
chmod 600 "${ENCRYPTED_FILE}"
rm -f "${BACKUP_FILE}"
echo "SUCCESS: Encrypted backup created at ${ENCRYPTED_FILE}"
EOF
sudo chmod 750 /opt/medicore/scripts/backup.sh

cat << 'EOF' | sudo tee /opt/medicore/scripts/restore.sh > /dev/null
#!/usr/bin/env bash
set -euo pipefail
BACKUP_FILE="${1:-}"
TARGET_DB="${2:-medicoredb}"
CONTAINER_NAME="medicore-prod-postgres"
DB_USER="medicore_user"
KEY_FILE="/etc/medicore/backup.key"

TEMP_DECRYPT="/tmp/restore_test_$$.sql.gz"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in "${BACKUP_FILE}" -out "${TEMP_DECRYPT}" -pass file:"${KEY_FILE}"

docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" | grep -q 1 || \
  docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${TARGET_DB};"

gunzip -c "${TEMP_DECRYPT}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${TARGET_DB}" -q
rm -f "${TEMP_DECRYPT}"
echo "SUCCESS: Database restored into ${TARGET_DB}"
EOF
sudo chmod 750 /opt/medicore/scripts/restore.sh

echo "=== Step 3: Execute Live Encrypted Backup ==="
sudo /opt/medicore/scripts/backup.sh
LATEST_BACKUP=$(ls -t /var/backups/medicore/medicoredb_*.sql.gz.enc | head -n 1)
ls -lh "$LATEST_BACKUP"

echo "=== Step 4: Execute Live Restore into Isolated Database (medicore_restore_test) ==="
sudo /opt/medicore/scripts/restore.sh "$LATEST_BACKUP" medicore_restore_test

echo "=== Step 5: Verify Integrity & Record Counts in Isolated Database ==="
echo -n "Medicines in test DB: "
docker exec medicore-prod-postgres psql -U medicore_user -d medicore_restore_test -t -c "SELECT count(*) FROM medicines;"
echo -n "Users in test DB: "
docker exec medicore-prod-postgres psql -U medicore_user -d medicore_restore_test -t -c "SELECT count(*) FROM users;"
echo -n "Suppliers in test DB: "
docker exec medicore-prod-postgres psql -U medicore_user -d medicore_restore_test -t -c "SELECT count(*) FROM suppliers;"

echo "=== Step 6: Clean Up Isolated Test Database ==="
docker exec medicore-prod-postgres psql -U medicore_user -d postgres -c "DROP DATABASE medicore_restore_test;"
echo "Isolated test database dropped cleanly."

echo "=== Step 7: Verify Production Database Still Unaffected & Healthy ==="
echo -n "Medicines in production DB (medicoredb): "
docker exec medicore-prod-postgres psql -U medicore_user -d medicoredb -t -c "SELECT count(*) FROM medicines;"

echo "=== Step 8: Configure Nightly Backup Cron Job ==="
sudo tee /etc/cron.d/medicore-backup > /dev/null << 'CRON'
0 2 * * * root /opt/medicore/scripts/backup.sh >> /var/log/medicore_backup.log 2>&1
CRON
sudo chmod 644 /etc/cron.d/medicore-backup
echo "SUCCESS: Nightly backup cron configured at /etc/cron.d/medicore-backup"
