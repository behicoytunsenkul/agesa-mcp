import { config as loadEnv } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Dosya env'leri shell'deki PG* / DATABASE_URL üzerine yazsın
for (const name of [".env", ".env.local"]) {
  const full = join(root, name);
  if (existsSync(full)) loadEnv({ path: full, override: true, quiet: true });
}

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DATABASE_URL gerekli. .env veya .env.local dosyasını kontrol edin.");
  process.exit(1);
}

function redact(url) {
  return url.replace(/:([^:@/]+)@/, ":****@");
}

/** connectionString yerine açık alanlar — PGHOST/PGPORT env ezmesin */
function parsePgConfig(url) {
  const u = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
  const forceSsl = /sslmode=(require|verify-ca|verify-full)/i.test(url);
  return {
    host: u.hostname || "127.0.0.1",
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username || ""),
    password: decodeURIComponent(u.password || ""),
    database: decodeURIComponent((u.pathname || "/").replace(/^\//, "") || "postgres"),
    ssl: forceSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 8000,
    max: 1,
  };
}

const isNeon =
  connectionString.includes("neon.tech") ||
  connectionString.includes("neon.database");

const cfg = parsePgConfig(connectionString);
console.log("DATABASE_URL:", redact(connectionString));
console.log(
  `Hedef → host=${cfg.host} port=${cfg.port} user=${cfg.user} db=${cfg.database}`
);

const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");

let pool;

if (isNeon) {
  const { neonConfig, Pool } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString });
  console.log("Bağlantı: Neon (WebSocket)");
} else {
  const pgMod = await import("pg");
  const Pool = pgMod.Pool || pgMod.default?.Pool || pgMod.default;
  // PGPORT=5432 gibi shell env'lerin portu ezmesini engelle
  delete process.env.PGHOST;
  delete process.env.PGPORT;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
  delete process.env.PGDATABASE;
  pool = new Pool(cfg);
  console.log(`Bağlantı: Local PostgreSQL (TCP) · SSL=${cfg.ssl ? "on" : "off"}`);
}

try {
  const ping = await pool.query(
    "SELECT current_user AS kullanici, current_database() AS veritabani, version() AS surum"
  );
  console.log("Ping OK:", ping.rows[0]);

  await pool.query(sql);
  console.log("Schema uygulandı: firmalar + chat_sessions + chat_messages");
} catch (err) {
  console.error("\nSchema hatası:", err?.message || err);
  if (err?.code) console.error("Postgres code:", err.code);
  if (err?.detail) console.error("Detail:", err.detail);
  console.error(`
Olası nedenler:
1) .env.local user/şifre/port yanlış
2) Postgres 5433 dinlemiyor →  ss -tlnp | grep 5433
3) DB yok → docker exec postgres psql -U root -c "CREATE DATABASE firma_asistani;"
4) Shell'de PGPORT=5432 kalmıştı (artık URL portu kullanılıyor)

Hızlı test:
  docker exec postgres psql -U root -d firma_asistani -c 'SELECT 1'
`);
  process.exit(1);
} finally {
  await pool.end();
}
