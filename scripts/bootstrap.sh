#!/usr/bin/env bash
# Sıfırdan kurulum: ./scripts/bootstrap.sh --reset
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RESET=0
if [[ "${1:-}" == "--reset" ]]; then
  RESET=1
fi

echo "==> 1) Klasörler"
mkdir -p data/n8n-files

echo "==> 2) Env dosyaları"
cp -f .env.example .env
cp -f .env.example .env.local
echo "    .env ve .env.local yazıldı"

echo "==> 3) Eski stack temizliği"
docker compose down 2>/dev/null || true
docker rm -f n8n n8n-worker postgres redis 2>/dev/null || true
docker network rm n8n_network 2>/dev/null || true
docker network rm agesa-mcp_n8n_network 2>/dev/null || true

if [[ "$RESET" -eq 1 ]]; then
  echo "    --reset: volume'lar siliniyor (temiz Postgres)"
  docker compose down -v 2>/dev/null || true
  docker volume rm agesa-mcp_postgres_data agesa-mcp_redis_data agesa-mcp_n8n_data 2>/dev/null || true
fi

echo "==> 4) Docker compose up"
docker compose up -d

echo "==> 5) Postgres bekleniyor (root / n8n)"
ok=0
for i in $(seq 1 90); do
  if docker exec postgres pg_isready -U root -d n8n >/dev/null 2>&1; then
    echo "    postgres OK ($i sn)"
    ok=1
    break
  fi
  sleep 1
done
if [[ "$ok" -ne 1 ]]; then
  echo "HATA: postgres ayağa kalkmadı"
  docker logs postgres --tail 50 || true
  exit 1
fi

echo "==> 6) firma_asistani DB (yoksa)"
docker exec postgres psql -U root -d n8n -c "CREATE DATABASE firma_asistani;" 2>/dev/null || echo "    firma_asistani zaten var"

echo "==> 7) npm install"
npm install

echo "==> 8) Schema (Next.js tabloları)"
npm run db:setup

echo "==> 9) Durum"
docker compose ps

echo ""
echo "============================================"
echo "  KURULUM TAMAM"
echo "============================================"
echo "  npm run build && npm run start"
echo "  Portal : http://SUNUCU_IP:3000"
echo "  n8n    : http://SUNUCU_IP:5678"
echo "  Login  : deneme-user@test.com / DenemeUser123"
echo ""
echo "  n8n Postgres credential:"
echo "    Host=postgres Port=5432"
echo "    Database=firma_asistani"
echo "    User=root Password=123456 SSL=off"
echo "============================================"
