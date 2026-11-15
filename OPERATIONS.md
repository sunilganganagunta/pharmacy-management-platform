# MediCore — Operations Runbook & Operational Procedures

This operational runbook provides step-by-step procedures for managing, monitoring, backing up, and troubleshooting the MediCore Smart Pharmacy Management Platform.

---

## 1. Start Application

### Local Docker Compose (Development / Testing)
```bash
# Start all containers in detached mode
docker compose up -d

# Verify containers are healthy
docker compose ps
```

### Production Deployment (EC2 Orchestration)
```bash
# Deploy using production environment configuration
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

---

## 2. Stop Application

### Graceful Shutdown (Preserving Database Volume)
```bash
# Stop all containers safely without removing data
docker compose down

# For production stack
docker compose -f docker-compose.prod.yml down
```

> [!CAUTION]
> Never pass the `-v` or `--volumes` flag to `docker compose down` on production environments, as this will destroy the PostgreSQL persistent storage volume (`pgdata`).

---

## 3. Restart Application

### Zero-Downtime Rolling Restart
```bash
# Restart backend service
docker compose restart backend

# Restart frontend reverse proxy
docker compose restart frontend

# Restart all services
docker compose restart
```

---

## 4. Check Container Status

```bash
# Display running containers, status, and healthcheck states
docker compose ps

# Detailed container resource usage (CPU, Memory, I/O)
docker stats --no-stream
```

---

## 5. View Container Logs

```bash
# View real-time logs for all services
docker compose logs -f

# View backend Spring Boot logs (last 200 lines)
docker compose logs -f --tail=200 backend

# View frontend / Nginx access and error logs
docker compose logs -f --tail=100 frontend

# View PostgreSQL database logs
docker compose logs -f --tail=100 postgres
```

---

## 6. Check Application Health

### HTTP Actuator Health Check
```bash
# Check Spring Boot Actuator health probe
curl -i http://localhost:8080/actuator/health

# Check via Nginx reverse proxy
curl -i http://localhost/actuator/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"UP"}
```

### PostgreSQL Database Readiness Check
```bash
# Run pg_isready inside the container
docker compose exec postgres pg_isready -U medicore_user -d medicoredb

# Expected output:
# /var/run/postgresql:5432 - accepting connections
```

### Automated Suite Check
```bash
bash ./scripts/health-check.sh
```

---

## 7. Backup Database

MediCore includes an automated, encrypted backup utility at `scripts/backup.sh`.

```bash
# Trigger immediate database backup
bash ./scripts/backup.sh

# The script performs:
# 1. pg_dump execution inside the postgres container
# 2. gzip compression
# 3. Size verification (> 1024 bytes)
# 4. AES-256-CBC encryption (if KEY_FILE is present)
# 5. Backup rotation (retains last 7 days)
```

Backups are saved to `/var/backups/medicore/medicoredb_<TIMESTAMP>.sql.gz`.

---

## 8. Restore Database

To restore a database from an encrypted or compressed backup dump:

```bash
# Usage: bash scripts/restore.sh <backup_file> [target_database]
bash ./scripts/restore.sh /var/backups/medicore/medicoredb_20261112_120000.sql.gz.enc medicoredb
```

---

## 9. Rollback Deployment

If a newly deployed image fails post-deployment health checks, revert immediately using `scripts/rollback.sh`:

```bash
# Execute automated rollback to previous release tag
bash ./scripts/rollback.sh

# The script reads previous_version.txt, updates .env IMAGE_TAG,
# redeploys via docker-compose.prod.yml, and runs health-check.sh.
```

---

## 10. Troubleshooting Steps

| Issue | Potential Cause | Remediation Procedure |
| :--- | :--- | :--- |
| **Backend fails on startup (`Connection refused: postgres:5432`)** | PostgreSQL container still initializing or unhealthy. | Check `docker compose logs postgres`. Ensure `depends_on.postgres.condition: service_healthy` is configured in `docker-compose.yml`. |
| **Login fails with `Invalid username or password`** | Seed password mismatch or legacy volume hash. | Verify database credentials with `SELECT username, role, is_active FROM users;`. Ensure Flyway `V4` migration is applied. |
| **Nginx returns `502 Bad Gateway`** | Backend service is down or restart in progress. | Run `docker compose ps backend`. Check `docker compose logs backend --tail=50`. |
| **Disk space alert on EC2** | Unpruned Docker images or logs accumulating. | Run `docker system prune -f` and review log retention in `/var/lib/docker/containers/`. |
| **Port conflict (`bind: address already in use: 80`)** | Host Nginx or Apache already bound to port 80. | Stop the host service: `sudo systemctl stop nginx && sudo systemctl disable nginx`. |

