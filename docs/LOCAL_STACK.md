# Yerel Sunucu Kurulumu (Neon yok)

AgeSA MCP + yerel PostgreSQL + n8n — aynı Linux sunucu.

## Bağlantı bilgileri

| Alan | Değer |
|------|--------|
| Host | `127.0.0.1` |
| Port | `5433` |
| Database | `firma_asistani` |
| User | `root` |
| Password | `123456` |

```env
DATABASE_URL=postgresql://root:123456@127.0.0.1:5433/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

---

## 1) Repo

```bash
cd ~/VeriTabaniMCP/agesa-mcp
git pull
npm install
```

---

## 2) PostgreSQL

### Seçenek A — Docker (önerilen)

```bash
docker compose down
docker compose up -d
docker compose ps
```

### Seçenek B — Mevcut Postgres (5433)

DB yoksa oluşturun:

```bash
psql -h 127.0.0.1 -p 5433 -U root -d postgres -c "CREATE DATABASE firma_asistani;"
```

---

## 3) Env

```bash
cp .env.example .env.local
# veya doğrudan:
cat > .env.local <<'EOF'
DATABASE_URL=postgresql://root:123456@127.0.0.1:5433/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
EOF
```

---

## 4) Schema + Next.js

```bash
npm run db:ping     # OK görmelisiniz
npm run db:setup
npm run build
npm run start       # 0.0.0.0:3000
```

PM2:

```bash
sudo npm i -g pm2
pm2 start npm --name agesa-mcp -- start
pm2 save
```

Firewall:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5678/tcp
sudo ufw reload
```

Uygulama: `http://SUNUCU_IP:3000`  
Login: `deneme-user@test.com` / `DenemeUser123`

Veri: **Datas → Excel import**

---

## 5) n8n

Postgres ile **aynı compose** içinde çalıştırın (önerilen):

```bash
# Eski ayrı n8n container varsa kaldırın
docker rm -f n8n agesa-n8n 2>/dev/null || true

docker compose up -d
```

UI: `http://SUNUCU_IP:5678`

### Postgres credential (n8n Docker → aynı network)

| Alan | Değer |
|------|--------|
| Host | `postgres` |
| Port | `5432` |
| Database | `firma_asistani` |
| User | `root` |
| Password | `123456` |
| SSL | Disable |
| Ignore SSL Issues | açık |

> **Önemli:** n8n container içinde `127.0.0.1` = n8n’in kendisi (Postgres değil).  
> Host’a `127.0.0.1:5433` yazmayın. Compose içinden host adı `postgres`, port **5432** (container içi).

Alternatif (Postgres host’ta, n8n Docker’da):

| Alan | Değer |
|------|--------|
| Host | `host.docker.internal` |
| Port | `5433` |
| … | aynı user/pass/db |

1. Import: `n8n/firma-veritabani-asistani.json`
2. **Tüm Firmaları Getir** → bu credential  
3. **OpenAI** → API key  
4. Chat Trigger → Public + **Active**  
5. Webhook: `http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat`

### Credential test (sunucuda)

```bash
# n8n container'dan Postgres'e ping
docker exec -it agesa-n8n sh -c 'nc -zv postgres 5432 || true'

# Postgres tarafında auth
docker exec -it agesa-postgres psql -U root -d firma_asistani -c 'SELECT 1'
```

---

## 6) Kontrol

```bash
ss -tlnp | grep 5433
npm run db:ping
curl -s http://127.0.0.1:3000/api/dashboard | head
```
