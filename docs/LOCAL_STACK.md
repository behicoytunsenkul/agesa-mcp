# Sıfırdan Kurulum — Yerel PostgreSQL + n8n + AgeSA MCP

Postgres bilgileri:

| Alan | Değer |
|------|--------|
| Host | `127.0.0.1` |
| Port | `5432` |
| User | `root` |
| Password | `123456` |
| Database | `n8n` |

`DATABASE_URL`:

```env
postgresql://root:123456@127.0.0.1:5432/n8n
```

---

## 0) Sunucuya hazırlık

```bash
sudo apt update
sudo apt install -y git curl docker.io docker-compose-v2
sudo usermod -aG docker $USER
# çıkış yapıp tekrar SSH ile girin (docker grubu için)

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

---

## 1) Repoyu çek

```bash
cd ~
git clone https://github.com/behicoytunsenkul/agesa-mcp.git
# veya zaten varsa:
cd ~/agesa-mcp   # sizin path: ~/VeriTabaniMCP/agesa-mcp olabilir
git pull
```

---

## 2) Postgres + n8n’i Docker ile ayağa kaldır

> Eski volume ile eski şifre/user kaldıysa sıfırlamak için:
> `docker compose down -v` (veri silinir)

```bash
cd ~/VeriTabaniMCP/agesa-mcp   # kendi klasörünüz
docker compose down
docker compose up -d
docker compose ps
```

Beklenen:

- `agesa-postgres` → healthy  
- `agesa-n8n` → running  

Kontrol:

```bash
docker exec -it agesa-postgres psql -U root -d n8n -c '\dt'
```

İlk açılışta `firmalar`, `chat_sessions`, `chat_messages` tabloları `schema.sql` ile oluşur.  
Görmüyorsanız:

```bash
# Next tarafındaki script (aynı DB'ye bağlanır)
cp .env.example .env.local
npm install
npm run db:setup
```

---

## 3) Firma tablolarını doğrula / yeniden oluştur

`scripts/schema.sql` şunları yaratır:

- `public.firmalar` (firma verisi)
- `public.chat_sessions` / `public.chat_messages` (OmniAgent logları)

```bash
npm run db:setup
# "Bağlantı: Local / klasik PostgreSQL" + "Schema uygulandı" görmelisiniz
```

Manuel alternatif:

```bash
docker exec -i agesa-postgres psql -U root -d n8n < scripts/schema.sql
```

---

## 4) Next.js (AgeSA MCP Online)

```bash
cp .env.example .env.local
# İçerik zaten doğru olmalı:
# DATABASE_URL=postgresql://root:123456@127.0.0.1:5432/n8n
# N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat

npm install
npm run build
npm run start
```

Firewall (başka cihazdan erişim):

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5678/tcp
sudo ufw reload
```

- Uygulama: `http://SUNUCU_IP:3000`  
- Login: `deneme-user@test.com` / `DenemeUser123`

### Veriyi doldur (firma)

1. Login → **Datas**
2. Excel import (Firmalar sheet)  
   veya satır satır **Yeni firma**

PM2 (sürekli açık):

```bash
sudo npm i -g pm2
pm2 start npm --name agesa-mcp -- start
pm2 save && pm2 startup
```

---

## 5) n8n yapılandırma (sıfırdan)

### 5.1 UI’ye gir

`http://SUNUCU_IP:5678` → ilk açılışta owner hesabı oluşturun.

### 5.2 Workflow import

1. n8n → **Workflows** → **Import**
2. Dosya: `n8n/firma-veritabani-asistani.json`

### 5.3 Postgres credential (firma sorguları için)

**Credentials → Add → Postgres**

| Alan | Değer |
|------|--------|
| Host | `postgres` (n8n Docker içindeyse) **veya** `127.0.0.1` (n8n host’ta ise) |
| Port | `5432` |
| Database | `n8n` |
| User | `root` |
| Password | `123456` |
| SSL | Disable |

**Tüm Firmaları Getir** node’unda bu credential’ı seçin.

> n8n container içinden Postgres’e host adı: `postgres` (compose servis adı).  
> Host makineden test: `127.0.0.1`.

### 5.4 OpenAI credential

**OpenAI Chat Model** → kendi API key’iniz.

### 5.5 Chat Trigger

1. Node: **Sohbet Mesajı Alındığında**
2. **Make Chat Publicly Available** = ON  
3. Mode = Embedded Chat (Next kendi chat UI kullanıyor)  
4. Allowed Origin / CORS = `*` veya `http://SUNUCU_IP:3000`  
5. Workflow’u **Active** edin  

Webhook URL (Next `.env.local`):

```env
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

Dışarıdan test:

```text
http://SUNUCU_IP:5678/webhook/firma-asistani-chat-webhook/chat
```

Next’i yeniden başlatın:

```bash
pm2 restart agesa-mcp
# veya
npm run build && npm run start
```

### 5.6 Agent uyarısı

Postgres çok satır döndürürse Agent döngüye girebilir. Workflow’da **executeOnce = true** olmalı (JSON’da var).

---

## 6) Hızlı kontrol

```bash
# Postgres
docker exec -it agesa-postgres psql -U root -d n8n -c 'SELECT COUNT(*) FROM firmalar;'

# Next API
curl -s http://127.0.0.1:3000/api/dashboard | head -c 200

# n8n
curl -I http://127.0.0.1:5678
```

OmniAgent’den bir soru sorun → **Logs**’ta session görünsün.

---

## 7) Sık sorunlar

| Sorun | Çözüm |
|-------|--------|
| `password authentication failed` | Eski volume: `docker compose down -v && docker compose up -d` |
| `relation firmalar does not exist` | `npm run db:setup` |
| Next `ETIMEDOUT` Neon’a | Artık local kullanın; `.env.local` yukarıdaki URL olmalı |
| Chat cevap yok | Workflow Active mi? Credential doğru mu? `N8N_CHAT_URL` doğru mu? |
| Başka cihazdan açılmıyor | `ufw allow 3000/tcp` + `http://SUNUCU_IP:3000` (localhost değil) |

---

## Özet komutlar (kopyala-yapıştır)

```bash
cd ~/VeriTabaniMCP/agesa-mcp
git pull
docker compose down
docker compose up -d
cp .env.example .env.local
npm install
npm run db:setup
npm run build
pm2 delete agesa-mcp 2>/dev/null; pm2 start npm --name agesa-mcp -- start
pm2 save
```

Sonra n8n UI → workflow import → Postgres credential (`root` / `123456` / db `n8n`) → OpenAI → Active.
