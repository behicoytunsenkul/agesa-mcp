import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import type { QueryResult, QueryResultRow } from "pg";

function loadEnvFiles() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const full = resolve(root, name);
    if (existsSync(full)) {
      loadEnv({ path: full, override: false, quiet: true });
    }
  }
}

loadEnvFiles();

type AnyPool = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<QueryResult<T>>;
  end?: () => Promise<void>;
};

declare global {
  var __agesaPool: AnyPool | undefined;
  var __agesaPoolMode: "local" | "neon" | undefined;
}

function isNeonUrl(url: string) {
  return url.includes("neon.tech") || url.includes("neon.database");
}

async function createPool(connectionString: string): Promise<AnyPool> {
  if (isNeonUrl(connectionString)) {
    const { neonConfig, Pool } = await import("@neondatabase/serverless");
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws;
    global.__agesaPoolMode = "neon";
    return new Pool({ connectionString, max: 10 }) as unknown as AnyPool;
  }

  const { Pool } = await import("pg");
  global.__agesaPoolMode = "local";
  const forceSsl = /sslmode=(require|verify-ca|verify-full)/i.test(
    connectionString
  );
  return new Pool({
    connectionString,
    ssl: forceSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    max: 10,
  });
}

export async function getPool(): Promise<AnyPool> {
  if (global.__agesaPool) return global.__agesaPool;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Proje kökünde .env veya .env.local olmalı."
    );
  }

  global.__agesaPool = await createPool(connectionString);
  return global.__agesaPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  const pool = await getPool();
  return pool.query<T>(text, params);
}
