# AgeSA MCP — Mevcut n8n stack üzerine kurulum

Sizin zaten kurulu olanlar (tekrar etmeyin):

- `n8n_network`
- `postgres` (user=`root`, pass=`123456`, db=`n8n`, port=`5432`)
- `redis`, `mongodb`, `qdrant`, `n8n :5678`

Aşağıdakiler **eksik kalan** adımlardır.

---

## 0) Repo

```bash
cd ~
git clone https://github.com/behicoytunsenkul/agesa-mcp.git
# veya mevcut klasör:
cd ~/VeriTabaniMCP/agesa-mcp   # sizin path
git pull
```

---

## 1) Firma DB oluştur (`n8n` DB’sine dokunma)

Postgres’te n8n meta DB’si `n8n`. Firma verisi için ayrı DB: **`firma_asistani`**.

```bash
cd ~/VeriTabaniMCP/agesa-mcp
chmod +x scripts/create-firma-db.sh
./scripts/create-firma-db.sh
```

Elle yapmak isterseniz:

```bash
docker exec -i postgres psql -U root -d n8n -c "CREATE DATABASE firma_asistani WITH ENCODING 'UTF8' TEMPLATE template0;"
```

Kontrol:

```bash
docker exec -i postgres psql -U root -d n8n -c "\l"
# firma_asistani listede görünmeli
```

---

## 2) Next.js env + şema + çalıştır

`.env` / `.env.local` (repoda güncel):

```env
DATABASE_URL=postgresql://root:123456@127.0.0.1:5432/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

```bash
git pull
npm install
npm run db:setup
# Beklenen: "Bağlantı: Local / klasik PostgreSQL" + "Schema uygulandı..."

npm run build
npm run start
# http://0.0.0.0:3000
```

Firewall (gerekirse):

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

Başka cihaz: `http://SUNUCU_IP:3000`  
Login: `deneme-user@test.com` / `DenemeUser123`

### Veri yükle

Datas → Excel import (Firmalar sheet)  
veya elinizdeki xlsx’i yükleyin.

PM2 (kalıcı):

```bash
sudo npm i -g pm2
pm2 start npm --name agesa-mcp -- start
pm2 save
```

---

## 3) n8n — sadece firma Postgres credential + workflow

n8n zaten ayakta. Yapılacaklar:

### 3.1 Postgres credential (firma DB)

n8n UI → **Credentials → Postgres → Add**

| Alan | Değer |
|------|--------|
| Host | `postgres` *(aynı docker network)* |
| Database | `firma_asistani` *(n8n değil!)* |
| User | `root` |
| Password | `123456` |
| Port | `5432` |
| SSL | Disable |
| Name | örn. `Firma Postgres` |

> Host `127.0.0.1` n8n container içinden genelde **çalışmaz**. Docker network adı: **`postgres`**.

### 3.2 Workflow import

1. n8n → Workflows → **Import from File**
2. Dosya: `n8n/firma-veritabani-asistani.json`
3. **Tüm Firmaları Getir** node → credential = `Firma Postgres`
4. **OpenAI Chat Model** → kendi OpenAI key
5. Chat Trigger:
   - Public = ON
   - Allowed Origin = `*` veya `http://SUNUCU_IP:3000`
6. Workflow **Active**

Webhook (chat):

```text
http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

Next `.env` içindeki `N8N_CHAT_URL` bununla aynı olmalı. Dışarıdan erişilecekse:

```env
N8N_CHAT_URL=http://SUNUCU_IP:5678/webhook/firma-asistani-chat-webhook/chat
```

Sonra Next’i yeniden build/start veya `pm2 restart agesa-mcp`.

### 3.3 Agent notu

Workflow’da `executeOnce=true` olmalı (JSON’da var). Postgres çok satır döndürür; Agent’ın satır satır loop’a girmesini engeller.

---

## 4) Hızlı test

```bash
# DB
docker exec -i postgres psql -U root -d firma_asistani -c "SELECT COUNT(*) FROM firmalar;"

# Next API
curl -s http://127.0.0.1:3000/api/dashboard | head

# n8n webhook (Active workflow sonrası)
curl -s -X POST http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat \
  -H 'Content-Type: application/json' \
  -d '{"action":"sendMessage","sessionId":"test-1","chatInput":"Merhaba"}'
```

---

## Özet tablo

| Servis | Ne için | DB / Port |
|--------|---------|-----------|
| `postgres` / db=`n8n` | n8n kendi verisi | 5432 |
| `postgres` / db=`firma_asistani` | AgeSA + agent firmalar tablosu | 5432 |
| Next | UI + API | 3000 |
| n8n | OmniAgent webhook | 5678 |

Redis / Mongo / Qdrant’a AgeSA Next’in ihtiyacı yok; dokunmayın.
