#!/usr/bin/env bash
# Servisleri sırayla aç (volume silmez)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker network create agesa_net 2>/dev/null || true
docker compose -f docker-compose.postgres.yml up -d
docker compose -f docker-compose.redis.yml up -d
docker compose -f docker-compose.n8n.yml up -d
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
