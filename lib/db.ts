import { Pool, type QueryResultRow } from "pg";

declare global {
  var __agesaPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. .env.local dosyasına Neon connection string ekleyin."
    );
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
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
