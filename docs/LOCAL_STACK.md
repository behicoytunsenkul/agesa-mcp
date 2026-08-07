# Yerel Stack — Postgres + Redis + n8n

Sizin çalışan `docker run` ayarlarına göre compose:

| Servis | Container | Port (host) |
|--------|-----------|-------------|
| PostgreSQL | `postgres` | `5433` → 5432 |
| Redis | `redis` | (iç) 6379 |
| n8n | `n8n` | `5678` |
| n8n worker | `n8n-worker` | — |

## Kimlik bilgileri

| Alan | Değer |
|------|--------|
| Postgres user | `root` |
| Postgres password | `123456` |
| n8n kendi DB | `n8n` (otomasyon metadatası) |
| Firma / Next.js DB | `firma_asistani` |
| Host (container içi) | `postgres` |
| Host (sunucu / Next.js) | `127.0.0.1:5433` |

```env
DATABASE_URL=postgresql://root:123456@127.0.0.1:5433/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

## Kurulum (sıfırdan)

```bash
cd ~/VeriTabaniMCP/agesa-mcp   # kendi yolu
git pull

# Dosya klasörü (compose bind mount)
mkdir -p /home/dsk1123095nx/n8n-data

# Temiz başlat (eski volume varsa silmek için -v)
docker compose down
docker compose up -d

docker compose ps
docker logs n8n --tail 50
```

Beklenen: `postgres`, `redis`, `n8n`, `n8n-worker` hepsi **Up**.

## Next.js

```bash
cat > .env.local <<'EOF'
DATABASE_URL=postgresql://root:123456@127.0.0.1:5433/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
EOF

npm install
npm run db:ping
npm run db:setup
npm run build
npm run start
```

## n8n Postgres credential (firma sorguları)

n8n’in kendi DB’si (`n8n`) ≠ firma tabloları.

Workflow’daki **Postgres** credential:

| Alan | Değer |
|------|--------|
| Host | `postgres` |
| Port | `5432` |
| Database | `firma_asistani` |
| User | `root` |
| Password | `123456` |
| SSL | Disable |

Import: `n8n/firma-veritabani-asistani.json` → Active.

## Kontrol

```bash
docker compose ps
docker exec -it postgres psql -U root -d firma_asistani -c '\dt'
docker exec -it postgres psql -U root -d n8n -c '\dt'
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5678
```
