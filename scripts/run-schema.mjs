import { config as loadEnv } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

for (const name of [".env.local", ".env"]) {
  const full = join(root, name);
  if (existsSync(full)) loadEnv({ path: full, override: false, quiet: true });
}

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DATABASE_URL gerekli. .env veya .env.local dosyasını kontrol edin.");
  process.exit(1);
}

function redact(url) {
  return url.replace(/:([^:@/]+)@/, ":****@");
}

function parseTarget(url) {
  try {
    const u = new URL(url.replace(/^postgresql:/, "http:"));
    return {
      host: u.hostname || "127.0.0.1",
      port: u.port || "5432",
      user: decodeURIComponent(u.username || ""),
      database: (u.pathname || "").replace(/^\//, "") || "postgres",
    };
  } catch {
    return null;
  }
}

const isNeon =
  connectionString.includes("neon.tech") ||
  connectionString.includes("neon.database");

const target = parseTarget(connectionString);
console.log("DATABASE_URL:", redact(connectionString));
if (target) {
  console.log(
    `Hedef → host=${target.host} port=${target.port} user=${target.user} db=${target.database}`
  );
}

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
  // Yerel Postgres: SSL kapalı (sslmode=require varsa bile local'de genelde gerekmez)
  const forceSsl = /sslmode=(require|verify-ca|verify-full)/i.test(
    connectionString
  );
  pool = new Pool({
    connectionString,
    ssl: forceSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 8000,
    // tek bağlantı yeterli
    max: 1,
  });
  console.log(
    `Bağlantı: Local PostgreSQL (TCP) · SSL=${forceSsl ? "on" : "off"}`
  );
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
  if (err?.severity) console.error("Detail:", err.detail);
  console.error(`
Olası nedenler:
1) .env.local içindeki user/şifre/port yanlış (auth_failed)
2) Postgres 5433'te dinlemiyor →  ss -tlnp | grep 5433
   Beklenen: user=root  password=123456  db=firma_asistani
3) Veritabanı yok →  createdb / CREATE DATABASE
4) pg_hba.conf password auth izin vermiyor

Hızlı test:
  psql "postgresql://USER:SIFRE@127.0.0.1:5433/firma_asistani" -c 'SELECT 1'
`);
  process.exit(1);
} finally {
  await pool.end();
}
