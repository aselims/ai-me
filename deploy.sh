#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="/var/www/spec.ai-me.dev"
STAGING_DIR=$(mktemp -d)
trap 'sudo rm -rf "$STAGING_DIR"' EXIT

echo "==> Building and extracting static site..."
docker build --output "$STAGING_DIR" .

echo "==> Setting permissions..."
sudo chown -R www-data:www-data "$STAGING_DIR"
sudo chmod -R u=rwX,g=rX,o=rX "$STAGING_DIR"

echo "==> Swapping directories (atomic-ish)..."
if [ -d "$DEPLOY_DIR" ]; then
    sudo mv "$DEPLOY_DIR" "${DEPLOY_DIR}.old"
fi
sudo mv "$STAGING_DIR/dist" "$DEPLOY_DIR"
sudo rm -rf "${DEPLOY_DIR}.old"

echo "==> Testing and reloading nginx..."
sudo nginx -t && sudo nginx -s reload

echo "==> Cleaning up old Docker images..."
docker image prune -f --filter "label!=keep" >/dev/null 2>&1 || true

echo "==> Deployed to $DEPLOY_DIR"
