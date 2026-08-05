import pg from "pg";

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on("error", (err) => {
    console.error("[db] unexpected pool error", err.message);
  });
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL not configured");
  return p.query(text, params);
}

export async function healthCheck() {
  const p = getPool();
  if (!p) return { ok: false, mode: "memory" };
  try {
    await p.query("SELECT 1");
    return { ok: true, mode: "postgres" };
  } catch (e) {
    return { ok: false, mode: "postgres", error: e.message };
  }
}
