#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PG="docker compose -f docker-compose.postgres.yml"
RD="docker compose -f docker-compose.redis.yml"
N8="docker compose -f docker-compose.n8n.yml"

cp -f .env.example .env
cp -f .env.example .env.local
mkdir -p /home/dsk1123095nx/n8n-data
mkdir -p data/n8n-files

$N8 down -v 2>/dev/null || true
$RD down -v 2>/dev/null || true
$PG down -v 2>/dev/null || true
docker rm -f n8n n8n-worker postgres redis 2>/dev/null || true

docker network rm n8n_network 2>/dev/null || true
docker network rm agesa_net 2>/dev/null || true
docker network create n8n_network

$PG up -d
for i in $(seq 1 90); do
  docker exec postgres pg_isready -U root -d n8n >/dev/null 2>&1 && break
  sleep 1
  [[ "$i" -eq 90 ]] && { docker logs postgres --tail 50; exit 1; }
done
docker exec postgres psql -U root -d n8n -c "CREATE DATABASE firma_asistani;" 2>/dev/null || true
echo "postgres OK"

$RD up -d
sleep 2
echo "redis OK"

$N8 up -d
sleep 5
docker logs n8n --tail 40
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

npm install
npm run db:setup

echo "Tamam. npm run build && npm run start"
