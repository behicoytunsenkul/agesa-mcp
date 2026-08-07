# Üç ayrı compose — sıfırdan

| Dosya | Servis |
|-------|--------|
| `docker-compose.postgres.yml` | PostgreSQL (`root` / `123456`, port **5433**) |
| `docker-compose.redis.yml` | Redis |
| `docker-compose.n8n.yml` | n8n (**SQLite** — kendi DB’si Postgres değil → restart olmaz) |

Ortak ağ: `agesa_net`

## Sıfırdan kur (tek komut)

```bash
cd ~/VeriTabaniMCP/agesa-mcp
git pull
chmod +x scripts/*.sh
./scripts/stack-reset.sh
npm run build && npm run start
```

## Ayrı ayrı

```bash
docker network create agesa_net
docker compose -f docker-compose.postgres.yml up -d
docker compose -f docker-compose.redis.yml up -d
docker compose -f docker-compose.n8n.yml up -d
```

## Env (repoda)

```
DATABASE_URL=postgresql://root:123456@127.0.0.1:5433/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

## n8n credential (firma)

| Alan | Değer |
|------|--------|
| Host | `postgres` |
| Port | `5432` |
| Database | `firma_asistani` |
| User | `root` |
| Password | `123456` |
| SSL | Disable |

> n8n kendi ayarları SQLite’ta; Postgres sadece firma verisi + Next.js içindir.
