#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE n8n;
  CREATE DATABASE firma_asistani;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname firma_asistani -f /schemas/schema.sql

echo "Init OK: databases n8n + firma_asistani"
