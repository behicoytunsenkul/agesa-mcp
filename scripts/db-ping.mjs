#!/usr/bin/env node
/**
 * Postgres bağlantı tanılama: npm run db:ping
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

for (const name of [".env", ".env.local"]) {
  const full = resolve(process.cwd(), name);
  if (existsSync(full)) loadEnv({ path: full, override: true, quiet: true });
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL yok");
  process.exit(1);
}

function parsePgConfig(connectionString) {
  const u = new URL(connectionString.replace(/^postgres(ql)?:/i, "http:"));
  const forceSsl = /sslmode=(require|verify-ca|verify-full)/i.test(
    connectionString
  );
  return {
    host: u.hostname || "127.0.0.1",
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username || ""),
    password: decodeURIComponent(u.password || ""),
    database: decodeURIComponent(
      (u.pathname || "/").replace(/^\//, "") || "postgres"
    ),
    ssl: forceSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 8000,
  };
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
    const r = await pool.query(
      "SELECT 1 AS ok, current_user, current_database()"
    );
    console.log("OK (Neon):", r.rows[0]);
    await pool.end();
  } else {
    const pgMod = await import("pg");
    const Client = pgMod.Client || pgMod.default?.Client;
    delete process.env.PGHOST;
    delete process.env.PGPORT;
    delete process.env.PGUSER;
    delete process.env.PGPASSWORD;
    delete process.env.PGDATABASE;
    const cfg = parsePgConfig(url);
    console.log(`Hedef → ${cfg.host}:${cfg.port}/${cfg.database}`);
    client = new Client(cfg);
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
