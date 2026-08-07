#!/usr/bin/env bash
# Tek komut: stack + env + schema
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Klasörler"
mkdir -p data/n8n-files

echo "==> Eski çakışan Docker ağı (varsa)"
docker network rm n8n_network 2>/dev/null || true

echo "==> .env.local"
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "    oluşturuldu (.env.example → .env.local)"
else
  echo "    mevcut, dokunulmadı"
fi

echo "==> Docker compose up"
docker compose up -d

echo "==> Postgres hazır olana kadar bekleniyor"
for i in $(seq 1 60); do
  if docker exec postgres pg_isready -U root -d postgres >/dev/null 2>&1; then
    echo "    postgres OK"
    break
  fi
  sleep 1
  if [[ "$i" -eq 60 ]]; then
    echo "Postgres ayağa kalkmadı. Log: docker logs postgres"
    exit 1
  fi
done

# Init script ilk volume'da DB oluşturur; eski volume'da DB yoksa oluştur
docker exec postgres psql -U root -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='firma_asistani'" | grep -q 1 \
  || docker exec postgres psql -U root -d postgres -c "CREATE DATABASE firma_asistani;"
docker exec postgres psql -U root -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='n8n'" | grep -q 1 \
  || docker exec postgres psql -U root -d postgres -c "CREATE DATABASE n8n;"

echo "==> npm install"
npm install

echo "==> Schema"
npm run db:setup

echo ""
echo "Hazır."
echo "  docker compose ps"
echo "  npm run build && npm run start"
echo "  Portal: http://SUNUCU_IP:3000"
echo "  n8n:    http://SUNUCU_IP:5678"
echo ""
echo "n8n Postgres credential:"
echo "  Host=postgres Port=5432 DB=firma_asistani User=root Pass=123456 SSL=off"
