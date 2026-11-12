#!/bin/bash
# ========================================================
# MediCore - Production Health Check Script
# Validates Nginx, Backend Actuator, and Database Health
# ========================================================
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8080/actuator/health}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:80/}"
MAX_RETRIES=15
DELAY=3

echo "Running MediCore Health Check..."

# Check Backend
echo -n "Checking Backend Health ($BACKEND_URL)... "
count=0
until curl -s -f "$BACKEND_URL" | grep -q '"status":"UP"'; do
  count=$((count + 1))
  if [ "$count" -ge "$MAX_RETRIES" ]; then
    echo "FAILED"
    echo "Backend did not report UP status within timeout period."
    exit 1
  fi
  sleep "$DELAY"
done
echo "UP"

# Check Frontend
echo -n "Checking Frontend Nginx ($FRONTEND_URL)... "
count=0
until curl -s -f "$FRONTEND_URL" > /dev/null; do
  count=$((count + 1))
  if [ "$count" -ge "$MAX_RETRIES" ]; then
    echo "FAILED"
    echo "Frontend web server not responding."
    exit 1
  fi
  sleep "$DELAY"
done
echo "OK"

echo "All MediCore services are healthy and operational!"

