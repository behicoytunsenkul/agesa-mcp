import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { neonConfig, Pool, type QueryResultRow } from "@neondatabase/serverless";
import ws from "ws";

// Node.js: Neon üzerinden WebSocket (443) — kurumsal ağlarda 5432 engelli olsa da çalışır
neonConfig.webSocketConstructor = ws;

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

  return new Pool({
    connectionString,
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
