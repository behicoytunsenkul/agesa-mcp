import { config as loadEnv } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

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
const pool = new Pool({ connectionString });

try {
  // Neon WS üzerinden (443); 5432 firewall engeline takılmaz
  await pool.query(sql);
  console.log("Schema uygulandı: firmalar + chat_sessions + chat_messages");
} catch (err) {
  console.error("Schema hatası:", err);
  process.exit(1);
} finally {
  await pool.end();
}
