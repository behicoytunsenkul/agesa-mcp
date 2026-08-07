# AgeSA MCP Online

Neon PostgreSQL üzerindeki firma veritabanı için Next.js portal: Dashboard, Datas (CRUD + Excel import/export), Logs ve sağ panoda OmniAgent (n8n).

## Özellikler

- **Dashboard** — kategori / değerlendirme / kanal / pipeline özetleri
- **Datas** — tablo, düzenleme, silme, Excel import/export, gelişmiş filtreler
- **Logs** — chat session geçmişi ve transcript
- **OmniAgent** — n8n Chat Trigger webhook üzerinden AI asistan
- **Login** — demo kullanıcı girişi + “beni hatırla”

## Gereksinimler

- Node.js 20+ (önerilen: 22)
- Neon / PostgreSQL connection string
- n8n Chat Trigger webhook URL

## Kurulum (lokal)

```bash
git clone https://github.com/behicoytunsenkul/agesa-mcp.git
cd agesa-mcp
npm install
cp .env.example .env.local
# DATABASE_URL ve N8N_CHAT_URL değerlerini doldurun
npm run db:setup
npm run dev
```

Açık adres: [http://localhost:3000](http://localhost:3000)

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Neon / PostgreSQL connection string |
| `N8N_CHAT_URL` | n8n Chat Trigger webhook URL |

`.env.local` asla commit edilmez. Örnek için `.env.example` kullanın.

## Production (Linux sunucu)

```bash
# 1) Sistem paketleri
sudo apt update
sudo apt install -y git curl

# 2) Node.js 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3) Repo
git clone https://github.com/behicoytunsenkul/agesa-mcp.git
cd agesa-mcp
npm install

# 4) Env
cp .env.example .env.local
nano .env.local   # DATABASE_URL ve N8N_CHAT_URL girin

# 5) DB şeması
npm run db:setup

# 6) Build + start
npm run build
npm run start     # varsayılan http://0.0.0.0:3000 değilse PORT=3000 npm run start
```

PM2 ile arka planda çalıştırma:

```bash
sudo npm i -g pm2
pm2 start npm --name agesa-mcp -- start
pm2 save
pm2 startup
```

Nginx reverse proxy örneği (`/etc/nginx/sites-available/agesa-mcp`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agesa-mcp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## n8n

Chat Trigger **Embedded Chat** + public olmalı. CORS için sunucu origin’inizi veya `*` ekleyin.

## Demo login

Uygulama içi demo kullanıcı `lib/auth.ts` içinde tanımlıdır. Production’da bunları değiştirmeniz önerilir.
