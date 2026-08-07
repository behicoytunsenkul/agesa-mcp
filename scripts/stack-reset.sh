#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PG="docker compose -f docker-compose.postgres.yml"
RD="docker compose -f docker-compose.redis.yml"
N8="docker compose -f docker-compose.n8n.yml"

cp -f .env.example .env
cp -f .env.example .env.local
mkdir -p data/n8n-files

$N8 down -v 2>/dev/null || true
$RD down -v 2>/dev/null || true
$PG down -v 2>/dev/null || true
docker rm -f n8n n8n-worker postgres redis 2>/dev/null || true

# Tek ağ adı: agesa_net (compose oluşturmaz, sadece external kullanır)
docker network rm agesa_net 2>/dev/null || true
docker network create agesa_net

$PG up -d
for i in $(seq 1 90); do
  docker exec postgres pg_isready -U root -d firma_asistani >/dev/null 2>&1 && break
  sleep 1
  [[ "$i" -eq 90 ]] && { docker logs postgres --tail 40; exit 1; }
done
echo "postgres OK"

$RD up -d
for i in $(seq 1 30); do
  docker exec redis redis-cli ping 2>/dev/null | grep -q PONG && break
  sleep 1
done
echo "redis OK"

$N8 up -d
sleep 4
echo "n8n OK"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

npm install
npm run db:setup

echo ""
echo "Tamam. npm run build && npm run start"
echo "n8n credential: Host=postgres Port=5432 DB=firma_asistani User=root Pass=123456 SSL=off"
