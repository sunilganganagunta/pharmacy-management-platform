#!/bin/bash
# ========================================================
# MediCore - Automated Rollback Script
# Reverts deployment to previous version tag
# ========================================================
set -euo pipefail

echo "=========================================="
echo " Initiating MediCore Rollback Procedure"
echo "=========================================="

if [ ! -f "previous_version.txt" ]; then
  echo "Error: previous_version.txt not found. Cannot automatically determine rollback target."
  exit 1
fi

PREV_TAG=$(cat previous_version.txt)
echo "Target Rollback Version: $PREV_TAG"

# Update .env
if [ -f ".env" ]; then
  sed -i "s/IMAGE_TAG=.*/IMAGE_TAG=$PREV_TAG/" .env
fi

# Redeploy previous version
echo "Deploying previous image tag..."
docker compose -f docker-compose.prod.yml up -d

echo "Running health checks on rolled-back release..."
bash ./scripts/health-check.sh

echo "Rollback to version $PREV_TAG completed successfully."
