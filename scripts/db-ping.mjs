#!/usr/bin/env node
/**
 * Postgres bağlantı tanılama: npm run db:ping
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

for (const name of [".env.local", ".env"]) {
  const full = resolve(process.cwd(), name);
  if (existsSync(full)) loadEnv({ path: full, override: false, quiet: true });
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL yok");
  process.exit(1);
}

const safe = url.replace(/:([^:@/]+)@/, ":****@");
console.log("URL:", safe);

const isNeon = url.includes("neon.tech");
let client;

try {
  if (isNeon) {
    const { neonConfig, Pool } = await import("@neondatabase/serverless");
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: url });
    const r = await pool.query("SELECT 1 AS ok, current_user, current_database()");
    console.log("OK (Neon):", r.rows[0]);
    await pool.end();
  } else {
    const pgMod = await import("pg");
    const Client = pgMod.Client || pgMod.default?.Client;
    const forceSsl = /sslmode=(require|verify-ca|verify-full)/i.test(url);
    client = new Client({
      connectionString: url,
      ssl: forceSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 8000,
    });
    await client.connect();
    const r = await client.query(
      "SELECT 1 AS ok, current_user, current_database(), inet_server_port() AS port"
    );
    console.log("OK (Local):", r.rows[0]);
    await client.end();
  }
} catch (err) {
  console.error("FAIL:", err?.message || err);
  if (err?.code) console.error("code:", err.code);
  process.exit(1);
}
