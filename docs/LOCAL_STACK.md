# Sıfırdan kurulum (tek komut)

Eski volume / karışık container’ları silip temiz kurar.

```bash
cd ~/VeriTabaniMCP/agesa-mcp
git pull
chmod +x scripts/bootstrap.sh scripts/docker-init-dbs.sh
./scripts/bootstrap.sh --reset
npm run build && npm run start
```

## Ne kurulur?

| Servis | User / Pass | Not |
|--------|-------------|-----|
| Postgres | `root` / `123456` | Host port **5433** |
| DB `n8n` | — | n8n kendi verisi |
| DB `firma_asistani` | — | Next.js + n8n firma sorguları |
| Redis | — | yardımcı |
| n8n UI | — | port **5678** |

## Env (repoda hazır)

```
DATABASE_URL=postgresql://root:123456@127.0.0.1:5433/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

## n8n credential

| Alan | Değer |
|------|--------|
| Host | `postgres` |
| Port | `5432` |
| Database | `firma_asistani` |
| User | `root` |
| Password | `123456` |
| SSL | Disable |

## Kontrol

```bash
docker compose ps
npm run db:ping
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5678
```

Beklenen: `postgres`, `redis`, `n8n` hepsi **Up** (Restarting değil).
