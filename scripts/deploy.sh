#!/bin/bash
# ========================================================
# MediCore - Manual or Orchestrated Deployment Script
# ========================================================
set -euo pipefail

ENV_FILE="${1:-.env}"
COMPOSE_FILE="${2:-docker-compose.prod.yml}"

echo "=========================================="
echo " Starting MediCore Production Deployment"
echo " Configuration: $ENV_FILE"
echo " Compose File: $COMPOSE_FILE"
echo "=========================================="

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found!"
  exit 1
fi

# Load variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Pull updated images from registry
echo "Pulling latest/versioned container images..."
docker compose -f "$COMPOSE_FILE" pull

# Start services
echo "Starting updated services..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Run health checks
echo "Verifying service availability..."
bash ./scripts/health-check.sh

echo "=========================================="
echo " MediCore Deployment Successful!"
echo "=========================================="

