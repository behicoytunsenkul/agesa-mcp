#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker network create n8n_network 2>/dev/null || true
mkdir -p /home/dsk1123095nx/n8n-data
docker compose -f docker-compose.postgres.yml up -d
docker compose -f docker-compose.redis.yml up -d
docker compose -f docker-compose.n8n.yml up -d
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
