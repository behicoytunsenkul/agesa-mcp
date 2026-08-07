import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL gerekli. Örnek: DATABASE_URL=... npm run db:setup");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("sslmode=require")
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
