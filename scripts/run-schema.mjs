import { config as loadEnv } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

for (const name of [".env.local", ".env"]) {
  const full = join(root, name);
  if (existsSync(full)) loadEnv({ path: full, override: false });
}

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DATABASE_URL gerekli. .env veya .env.local dosyasını kontrol edin.");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString,
  ssl:
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
});

await client.connect();
try {
  await client.query(sql);
  console.log("Schema uygulandı: firmalar + chat_sessions + chat_messages");
} finally {
  await client.end();
}
