# Yerel Stack — Postgres + Redis + n8n

Pull sonrası **hiçbir değeri elle değiştirmeden**:

```bash
cd ~/VeriTabaniMCP/agesa-mcp
git pull
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
npm run build && npm run start
```

| Servis | Container | Host port |
|--------|-----------|-----------|
| PostgreSQL | `postgres` | **5433** → 5432 |
| Redis | `redis` | (iç) 6379 |
| n8n | `n8n` | **5678** |
| n8n worker | `n8n-worker` | — |

## Port kuralı

| Nereden | Host | Port | Database |
|---------|------|------|----------|
| Next.js (host) | `127.0.0.1` | **5433** | `firma_asistani` |
| n8n credential (Docker) | `postgres` | **5432** | `firma_asistani` |
| n8n kendi DB’si | `postgres` | 5432 | `n8n` (compose ayarlı) |

`.env.local` (bootstrap otomatik kopyalar):

```env
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

Workflow: `n8n/firma-veritabani-asistani.json` → Active.

## Manuel (bootstrap olmadan)

```bash
mkdir -p data/n8n-files
docker network rm n8n_network 2>/dev/null || true
cp -n .env.example .env.local
docker compose up -d
npm install && npm run db:setup
npm run build && npm run start
```

## Sıfırdan volume

```bash
docker compose down -v
./scripts/bootstrap.sh
```
