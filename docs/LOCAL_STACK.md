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

```bash
docker run -d --name n8n --restart unless-stopped \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_HOST=0.0.0.0 \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e WEBHOOK_URL=http://SUNUCU_IP:5678/ \
  --add-host=host.docker.internal:host-gateway \
  docker.n8n.io/n8nio/n8n
```

1. UI: `http://SUNUCU_IP:5678`
2. Import: `n8n/firma-veritabani-asistani.json`
3. **Postgres credential**

| Alan | Değer |
|------|--------|
| Host | `host.docker.internal` (n8n Docker) veya `127.0.0.1` (native) |
| Port | `5433` |
| Database | `firma_asistani` |
| User | `root` |
| Password | `123456` |
| SSL | Disable |

4. **Tüm Firmaları Getir** → bu credential  
5. **OpenAI** → kendi API key  
6. Chat Trigger → Public + **Active**  
7. Webhook: `http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat`

---

## 6) Kontrol

```bash
ss -tlnp | grep 5433
npm run db:ping
curl -s http://127.0.0.1:3000/api/dashboard | head
```
