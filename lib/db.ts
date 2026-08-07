import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Pool, type QueryResultRow } from "pg";

function loadEnvFiles() {
  const root = process.cwd();
  // Production + local: ensure DATABASE_URL is available even if Next didn't inject it
  for (const name of [".env.local", ".env"]) {
    const full = resolve(root, name);
    if (existsSync(full)) {
      loadEnv({ path: full, override: false });
    }
  }
}

loadEnvFiles();

declare global {
  var __agesaPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Proje kökünde .env veya .env.local olmalı."
    );
  }

  const needsSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("sslmode=verify");

  return new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
}

export function getPool(): Pool {
  if (!global.__agesaPool) {
    global.__agesaPool = createPool();
  }
  return global.__agesaPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  const pool = getPool();
  return pool.query<T>(text, params);
}
