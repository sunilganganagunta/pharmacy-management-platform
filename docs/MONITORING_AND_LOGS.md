# MediCore Low-Cost Production Monitoring & Observability Guide

**Target Environment**: AWS EC2 (`t3.micro`, Ubuntu 24.04), Amazon ECR, Docker Compose  
**Monthly Observability Cost**: **$0.00 (100% Free Tier Compliant)**

---

## 1. System Telemetry & Resource Baseline

| Metric | Measured Value | Threshold / SLA | Status |
| :--- | :--- | :--- | :--- |
| **CPU Load Average** | `0.04, 0.03, 0.06` | `< 1.50` (2 vCPUs) | **HEALTHY** |
| **Physical Memory (RAM)**| `641 MiB used / 909 MiB` | `< 850 MiB` | **HEALTHY** |
| **Swap Space** | `480 MiB used / 2.0 GiB` | `< 1.5 GiB` | **ACTIVE & PROTECTING** |
| **Root Disk (`/dev/root`)**| `8.1 GB used / 19 GB (45%)` | `< 80%` (15 GB) | **HEALTHY** |
| **PostgreSQL Container** | `Up (healthy)` | Zero unmanaged restarts | **HEALTHY** |
| **Spring Boot Container** | `Up (healthy)` | Zero unmanaged restarts | **HEALTHY** |
| **Nginx Web Container** | `Up (healthy)` | Zero unmanaged restarts | **HEALTHY** |

---

## 2. Docker Daemon Log Rotation Configuration

To prevent unmanaged container logs from exhausting disk space, log rotation is enforced in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
Each container is restricted to three 10 MB rotating files (30 MB max per container).

---

## 3. Host System Health Script (`/opt/medicore/scripts/monitor.sh`)

The monitoring script evaluates system state across 7 checkpoints:
```bash
sudo /opt/medicore/scripts/monitor.sh
```
Output checkpoints:
1. Host uptime and 1/5/15-minute load averages.
2. Physical RAM and Swap usage (`free -h`).
3. Partition disk usage (`df -h`).
4. Docker container health status (`healthy`).
5. Spring Boot Actuator endpoint probe (`http://localhost:8080/actuator/health`).
6. Recent Nginx access logs.
7. Recent Spring Boot application logs.

---

## 4. AWS CloudWatch Metrics & Pricing Evaluation

| CloudWatch Capability | Free Tier Allowance | Standalone Pricing | MediCore Strategy |
| :--- | :--- | :--- | :--- |
| **EC2 Basic Monitoring** | Unlimited (5-min intervals) | $0.00 / month | **Enabled by Default** |
| **CloudWatch Detailed Monitoring** | None | $2.10 / instance / mo | **Disabled (Unnecessary)** |
| **Custom Metrics (Disk/RAM)** | 10 Metrics free | $0.30 / metric / mo | **Use 2 Metrics (Mem, Disk)** |
| **CloudWatch Alarms** | 10 Metric Alarms free | $0.10 / alarm / mo | **Configure 2 Alarms** |
| **CloudWatch Logs** | 5 GB ingestion / month | $0.50 / GB | **Docker local rotation** |

### Recommended Zero-Cost CloudWatch Alarms
1. **EC2 CPU Utilization Alarm**:
   - Metric: `AWS/EC2 CPUUtilization > 85%` for 15 minutes.
   - Action: SNS Notification to Administrator Email.
2. **EC2 Status Check Failed Alarm**:
   - Metric: `AWS/EC2 StatusCheckFailed_Instance > 0`.
   - Action: Automated Instance Reboot / Recovery.

---

## 5. Deployment Audit Trail & Logs (AWS Systems Manager & GitHub Actions)

Every deployment dispatched by GitHub Actions or run manually leaves an immutable audit trail in AWS Systems Manager.

### Inspect Past Deployment Executions
```bash
aws ssm list-commands \
  --instance-id i-0be536c99a4381e25 \
  --region ap-southeast-2 \
  --query "Commands[*].[CommandId,DocumentName,Status,RequestedDateTime,Comment]" \
  --output table
```

### View Standard Output from Deployment
```bash
aws ssm get-command-invocation \
  --command-id <COMMAND_ID> \
  --instance-id i-0be536c99a4381e25 \
  --region ap-southeast-2 \
  --query "StandardOutputContent" \
  --output text
```

### View Application Logs on EC2
```bash
# Backend logs
docker logs --tail 100 -f medicore-prod-backend

# Nginx reverse proxy logs
docker logs --tail 100 -f medicore-prod-frontend

# PostgreSQL logs
docker logs --tail 100 -f medicore-prod-postgres
```

