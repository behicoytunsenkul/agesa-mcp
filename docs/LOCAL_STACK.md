# Yerel Sunucu Kurulumu (Neon yok)

Bu rehber AgeSA MCP + yerel PostgreSQL + n8n’i **aynı Linux sunucuda** çalıştırır.

## Mimari

```
[Tarayıcı] → Next.js :3000
                ↓ DATABASE_URL
           PostgreSQL :5432  (firma_asistani)
                ↑
           n8n Postgres node
[Tarayıcı/OmniAgent] → Next /api/chat → n8n Chat Webhook :5678
```

---

## 1) PostgreSQL (Docker — önerilen)

```bash
cd ~/VeriTabaniMCP/agesa-mcp   # veya repo klasörünüz
git pull
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER   # sonra yeniden login gerekebilir

docker compose up -d
docker compose ps               # healthy olmalı
```

Varsayılan bağlantı:

```text
Host: 127.0.0.1
Port: 5432
Database: firma_asistani
User: agesa
Password: agesa123
```

`DATABASE_URL`:

```env
postgresql://agesa:agesa123@127.0.0.1:5432/firma_asistani
```

> Docker olmadan native Postgres kurduysanız aynı DB/user’ı oluşturup `scripts/schema.sql` uygulayın.

---

## 2) Next.js env

```bash
cp .env.example .env.local
nano .env.local
```

İçerik örneği:

```env
DATABASE_URL=postgresql://agesa:agesa123@127.0.0.1:5432/firma_asistani
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

```bash
npm install
npm run db:setup    # "Bağlantı: Local / klasik PostgreSQL" yazmalı
npm run build
npm run start       # 0.0.0.0:3000
```

Firewall (başka cihazdan erişim):

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5678/tcp   # n8n UI/webhook için
sudo ufw reload
```

Açılış: `http://SUNUCU_IP:3000`

---

## 3) Veriyi doldurma

### A) Excel ile (kolay)

1. `http://SUNUCU_IP:3000` → login → **Datas**
2. Excel import (Firmalar sheet)

### B) Neon’dan dump (opsiyonel)

Eski Neon’dan veri taşıyacaksanız (erişiminiz olan bir makinede):

```bash
pg_dump "$NEON_DATABASE_URL" --data-only --table=public.firmalar > firmalar.sql
psql "postgresql://agesa:agesa123@127.0.0.1:5432/firma_asistani" < firmalar.sql
```

---

## 4) n8n kurulumu (lokal)

### Docker ile n8n

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

`SUNUCU_IP` yerine gerçek IP yazın (webhook’ların dışarıdan çözülmesi için).

UI: `http://SUNUCU_IP:5678`

### Workflow import

1. n8n → **Import from File**
2. Dosya: `n8n/firma-veritabani-asistani.json` (repoda)

### Postgres credential (Neon yerine local)

**Credentials → Postgres → New**

| Alan | Değer |
|------|--------|
| Host | `host.docker.internal` (n8n Docker ise) veya `127.0.0.1` (n8n native ise) |
| Database | `firma_asistani` |
| User | `agesa` |
| Password | `agesa123` |
| Port | `5432` |
| SSL | Disable |

**Tüm Firmaları Getir** node’unda bu credential’ı seçin.

> n8n ve Postgres aynı `docker compose` network’ündeyse Host olarak `agesa-postgres` de kullanılabilir.

### OpenAI credential

**OpenAI Chat Model** → kendi OpenAI API key’iniz.

### Chat Trigger ayarları

1. **Make Chat Publicly Available** = ON  
2. Mode = **Embedded Chat** (veya Hosted; Next kendi UI’sini kullandığı için Embedded webhook yeterli)  
3. CORS / Allowed Origin = `*` veya `http://SUNUCU_IP:3000`  
4. Workflow’u **Active** edin  

Webhook path (workflow’daki `webhookId`):

```text
/webhook/firma-asistani-chat-webhook/chat
```

Next `.env.local` içinde:

```env
N8N_CHAT_URL=http://127.0.0.1:5678/webhook/firma-asistani-chat-webhook/chat
```

Next ile n8n farklı makinelerdeyse `127.0.0.1` yerine n8n sunucu IP’sini yazın; sonra:

```bash
npm run build && npm run start
# veya pm2 restart agesa-mcp
```

### Kritik n8n notu

Sizin workflow’da Chat → Postgres → Agent zinciri var. Postgres **çok satır** döndürürse Agent satır başına tekrar çalışabilir. Önlemek için:

- Agent node’da **executeOnce = true** (sizin JSON’da var)  
- Mümkünse Postgres sonrası tek item’a indirgeyen bir Code node ekleyin (önceki Agesa workflow’undaki “Tek Item Hazırla” gibi)

---

## 5) Hızlı kontrol listesi

| Kontrol | Komut / Beklenti |
|---------|------------------|
| Postgres ayakta | `docker compose ps` → healthy |
| Schema | `npm run db:setup` → Local PostgreSQL |
| Next | `curl -I http://127.0.0.1:3000` → 200/307 |
| Dashboard API | `curl http://127.0.0.1:3000/api/dashboard` → JSON |
| n8n | `http://SUNUCU_IP:5678` açılıyor |
| Chat | OmniAgent’den soru → Logs’ta görünüyor |

---

## 6) PM2 (Next sürekli açık)

```bash
sudo npm i -g pm2
cd ~/VeriTabaniMCP/agesa-mcp
pm2 start npm --name agesa-mcp -- start
pm2 save
pm2 startup
```

---

## Login (Next)

- E-posta: `deneme-user@test.com`
- Şifre: `DenemeUser123`
- (`lib/auth.ts` — production’da değiştirin)
