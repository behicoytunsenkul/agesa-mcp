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

const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
const isNeon =
  connectionString.includes("neon.tech") ||
  connectionString.includes("neon.database");

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
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  console.log("Bağlantı: Local / klasik PostgreSQL (TCP)");
}

try {
  await pool.query(sql);
  console.log("Schema uygulandı: firmalar + chat_sessions + chat_messages");
} catch (err) {
  console.error("Schema hatası:", err);
  process.exit(1);
} finally {
  await pool.end();
}
