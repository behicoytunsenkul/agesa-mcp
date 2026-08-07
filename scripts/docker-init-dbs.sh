#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE n8n'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec

  SELECT 'CREATE DATABASE firma_asistani'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'firma_asistani')\gexec
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname firma_asistani -f /schemas/schema.sql
