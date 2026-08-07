# Üç ayrı compose — ağ: n8n_network

| Dosya | İçerik |
|-------|--------|
| `docker-compose.postgres.yml` | Postgres `root`/`123456`, DB `n8n` + `firma_asistani`, port 5433 |
| `docker-compose.redis.yml` | Redis |
| `docker-compose.n8n.yml` | Sizin `docker run` ile aynı |

```bash
git pull
chmod +x scripts/*.sh
./scripts/stack-reset.sh
npm run build && npm run start
```

Next.js: `postgresql://root:123456@127.0.0.1:5433/firma_asistani`  
n8n firma credential: Host=`postgres` Port=`5432` DB=`firma_asistani` User=`root` Pass=`123456` SSL=off
