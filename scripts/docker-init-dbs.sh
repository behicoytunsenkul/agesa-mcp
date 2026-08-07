#!/bin/bash
# POSTGRES_DB=firma_asistani zaten var; şema yükle
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -f /schemas/schema.sql

echo "Init OK: firma_asistani + schema"
