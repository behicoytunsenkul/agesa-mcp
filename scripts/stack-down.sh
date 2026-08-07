#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose -f docker-compose.n8n.yml down || true
docker compose -f docker-compose.redis.yml down || true
docker compose -f docker-compose.postgres.yml down || true
echo "Stack durdu (volume'lar duruyor). Tam silmek için: ./scripts/stack-reset.sh"
