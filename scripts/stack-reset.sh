#!/usr/bin/env bash
# Sıfırdan: postgres + redis + n8n (ayrı compose dosyaları)
# Kullanım: ./scripts/stack-reset.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PG="docker compose -f docker-compose.postgres.yml"
RD="docker compose -f docker-compose.redis.yml"
N8="docker compose -f docker-compose.n8n.yml"

echo "==> Env"
cp -f .env.example .env
cp -f .env.example .env.local
mkdir -p data/n8n-files

echo "==> Eski container / volume temizliği"
$N8 down -v 2>/dev/null || true
$RD down -v 2>/dev/null || true
$PG down -v 2>/dev/null || true
docker rm -f n8n n8n-worker postgres redis 2>/dev/null || true
docker volume rm agesa-mcp_postgres_data agesa-mcp_redis_data agesa-mcp_n8n_data 2>/dev/null || true
docker volume rm $(docker volume ls -q | grep -E 'postgres_data|redis_data|n8n_data' || true) 2>/dev/null || true
docker network rm agesa_net 2>/dev/null || true
docker network rm n8n_network 2>/dev/null || true
docker network rm agesa-mcp_n8n_network 2>/dev/null || true

echo "==> 1/4 Ağ"
docker network create agesa_net

echo "==> 2/4 Postgres"
$PG up -d
echo "    bekleniyor..."
for i in $(seq 1 90); do
  if docker exec postgres pg_isready -U root -d firma_asistani >/dev/null 2>&1; then
    echo "    postgres OK"
    break
  fi
  sleep 1
  if [[ "$i" -eq 90 ]]; then
    echo "HATA postgres"; docker logs postgres --tail 40; exit 1
  fi
done

echo "==> 3/4 Redis"
$RD up -d
for i in $(seq 1 30); do
  if docker exec redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "    redis OK"
    break
  fi
  sleep 1
done

echo "==> 4/4 n8n (SQLite — Postgres'e bağlanmaz)"
$N8 up -d
sleep 5
docker logs n8n --tail 30 || true

echo "==> npm"
npm install
npm run db:setup

echo ""
echo "========== DURUM =========="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'NAMES|postgres|redis|n8n' || docker ps
echo ""
echo "Portal:  npm run build && npm run start  →  :3000"
echo "n8n UI:  http://SUNUCU_IP:5678"
echo "Credential: Host=postgres Port=5432 DB=firma_asistani User=root Pass=123456 SSL=off"
echo "==========================="
