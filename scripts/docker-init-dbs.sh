#!/bin/bash
# İlk volume oluşturmada çalışır (POSTGRES_DB=n8n zaten var)
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "CREATE DATABASE firma_asistani;"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname firma_asistani \
  -f /schemas/schema.sql

echo "Init OK: n8n (default) + firma_asistani + schema"
