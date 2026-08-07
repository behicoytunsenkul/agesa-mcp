# Üç ayrı compose — ağ: n8n_network

| Dosya | İçerik |
|-------|--------|
| `docker-compose.postgres.yml` | Postgres `root`/`123456`, DB `n8n` + `firma_asistani`, port 5433 |
| `docker-compose.redis.yml` | Redis |
| `docker-compose.n8n.yml` | Sizin `docker run` ile aynı |

```bash
git pull
chmod +x scripts/*.sh
# Ağ zaten varsa (yoksa bir kez: docker network create n8n_network)
./scripts/stack-reset.sh
npm run build && npm run start
```

Script **yeni ağ kurmaz**; sadece mevcut `n8n_network` kullanır.

Next.js: `postgresql://root:123456@127.0.0.1:5433/firma_asistani`  
n8n firma credential: Host=`postgres` Port=`5432` DB=`firma_asistani` User=`root` Pass=`123456` SSL=off
