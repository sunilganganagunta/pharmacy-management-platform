#!/usr/bin/env bash
set -e

echo "=== Step 1: Configure Docker Daemon Log Rotation ==="
if [ ! -f /etc/docker/daemon.json ]; then
  sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
  sudo systemctl reload docker || true
  echo "Docker daemon log rotation configured."
else
  echo "/etc/docker/daemon.json already exists."
fi

echo "=== Step 2: Install Low-Cost System Monitor Script ==="
cat << 'EOF' | sudo tee /opt/medicore/scripts/monitor.sh > /dev/null
#!/usr/bin/env bash
# ========================================================
# MediCore Low-Cost System & Service Health Monitor
# ========================================================
echo "=========================================================="
echo "MediCore Production Health Report: $(date)"
echo "Host: $(hostname) | Uptime: $(uptime -p)"
echo "=========================================================="

echo "--- 1. CPU & System Load ---"
uptime

echo "--- 2. Memory & Swap Utilization ---"
free -h

echo "--- 3. Disk Space Utilization ---"
df -h / /var/lib/medicore/pgdata

echo "--- 4. Docker Container Health Status ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}\t{{.Ports}}"

echo "--- 5. Application Actuator Health Status ---"
curl -s http://localhost:8080/actuator/health || curl -s http://localhost/actuator/health

echo ""
echo "--- 6. Recent Nginx Ingress Activity (Last 5 Access Entries) ---"
docker logs --tail 5 medicore-prod-frontend 2>&1

echo "--- 7. Recent Spring Boot Backend Logs (Last 5 Entries) ---"
docker logs --tail 5 medicore-prod-backend 2>&1

echo "=========================================================="
EOF
sudo chmod 750 /opt/medicore/scripts/monitor.sh

echo "=== Step 3: Execute Live Monitoring Report ==="
sudo /opt/medicore/scripts/monitor.sh
