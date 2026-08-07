#!/usr/bin/env bash
# Mevcut postgres konteynerinde firma_asistani DB'sini oluşturur.
set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-postgres}"
USER_NAME="${POSTGRES_USER:-root}"
DB_NAME="${FIRMA_DB:-firma_asistani}"

echo ">> Konteyner: $CONTAINER | user: $USER_NAME | db: $DB_NAME"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "HATA: '$CONTAINER' çalışmıyor. Önce postgres konteynerini başlatın."
  exit 1
fi

exists=$(docker exec -i "$CONTAINER" psql -U "$USER_NAME" -d n8n -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | tr -d '[:space:]')

if [[ "$exists" == "1" ]]; then
  echo "OK: '${DB_NAME}' zaten var."
else
  docker exec -i "$CONTAINER" psql -U "$USER_NAME" -d n8n -c "CREATE DATABASE ${DB_NAME} WITH ENCODING 'UTF8' TEMPLATE template0;"
  echo "OK: '${DB_NAME}' oluşturuldu."
fi

echo ">> Tablolar için: npm run db:setup"
