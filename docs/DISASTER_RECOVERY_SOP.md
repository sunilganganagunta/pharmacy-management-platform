# MediCore Disaster Recovery & Database Backup SOP

**Target System**: MediCore Smart Pharmacy Management Platform  
**RPO (Recovery Point Objective)**: < 24 hours (Daily Full Backup)  
**RTO (Recovery Time Objective)**: < 15 minutes  
**Storage Target**: Encrypted Local Volume (`/var/backups/medicore`) with optional Amazon S3 tiering  
**Encryption Standard**: AES-256-CBC with PBKDF2 key derivation (100,000 iterations)

---

## 1. Backup Strategy Overview

| Parameter | Specification |
| :--- | :--- |
| **Backup Tool** | `pg_dump` executed non-blockingly via container |
| **Schedule** | Daily at 02:00 UTC (`0 2 * * *`) via system cron |
| **Compression** | Gzip (`.sql.gz`) |
| **Encryption** | OpenSSL AES-256-CBC (`.sql.gz.enc`) |
| **Local Retention** | 7 Days (automated daily cleanup of older files) |
| **Security Permissions** | Backup directory: `chmod 700`, files: `chmod 600` |
| **Isolated Testing** | Automated restore to `medicore_restore_test` DB |

---

## 2. Backup Script Deployment on EC2

### Step 1: Initialize Backup Encryption Key
Generate a cryptographically secure 256-bit key on the host:
```bash
sudo mkdir -p /etc/medicore
sudo openssl rand -base64 32 | sudo tee /etc/medicore/backup.key > /dev/null
sudo chmod 600 /etc/medicore/backup.key
```

### Step 2: Install Scripts in `/opt/medicore/scripts`
```bash
sudo mkdir -p /opt/medicore/scripts
sudo cp scripts/backup.sh /opt/medicore/scripts/backup.sh
sudo cp scripts/restore.sh /opt/medicore/scripts/restore.sh
sudo chmod 750 /opt/medicore/scripts/*.sh
```

### Step 3: Schedule Nightly Cron Job
Edit crontab (`sudo crontab -e`):
```cron
# Run MediCore Encrypted Database Backup Daily at 02:00 AM UTC
0 2 * * * /opt/medicore/scripts/backup.sh >> /var/log/medicore_backup.log 2>&1
```

---

## 3. Disaster Recovery & Restoration Procedures

### Scenario A: Testing Backup Integrity in Isolated Test Database
To verify that backups are healthy without disrupting production traffic:
```bash
# 1. Run restore script pointing to test database
sudo /opt/medicore/scripts/restore.sh /var/backups/medicore/medicoredb_LATEST.sql.gz.enc medicore_restore_test

# 2. Check record counts in test database
docker exec medicore-prod-postgres psql -U medicore_user -d medicore_restore_test -c "SELECT count(*) FROM medicines;"
docker exec medicore-prod-postgres psql -U medicore_user -d medicore_restore_test -c "SELECT count(*) FROM users;"

# 3. Drop test database after verification
docker exec medicore-prod-postgres psql -U medicore_user -d postgres -c "DROP DATABASE medicore_restore_test;"
```

### Scenario B: Full Disaster Recovery onto Production Database
If data corruption occurs on `medicoredb`:
```bash
# 1. Temporarily stop the backend to prevent active connection locks
cd /home/ubuntu/medicore-app
docker compose -f docker-compose.prod.yml stop backend

# 2. Restore the database from encrypted backup
sudo /opt/medicore/scripts/restore.sh /var/backups/medicore/medicoredb_TARGET.sql.gz.enc medicoredb

# 3. Restart the backend
docker compose -f docker-compose.prod.yml start backend

# 4. Verify Actuator health
curl -f http://localhost:8080/actuator/health
```

### Scenario C: Recovery onto a Fresh EC2 Instance
If the EC2 instance is terminated or unrecoverable:
1. Launch new Ubuntu 24.04 instance in `ap-southeast-2` with `medicore-ec2-profile`.
2. Clone repository:
   ```bash
   git clone https://github.com/sunilganganagunta/pharmacy-management-platform.git
   ```
3. Pull Docker images from Amazon ECR:
   ```bash
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 774697186763.dkr.ecr.ap-southeast-2.amazonaws.com
   ```
4. Start Postgres container, restore from offsite backup, then start backend and frontend containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d postgres
   /opt/medicore/scripts/restore.sh latest_backup.sql.gz.enc medicoredb
   docker compose -f docker-compose.prod.yml up -d
   ```
