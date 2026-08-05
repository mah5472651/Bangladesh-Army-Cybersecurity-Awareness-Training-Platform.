import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const pool = getPool();
  if (!pool) {
    console.log("[migrate] No DATABASE_URL — skipping (memory mode).");
    process.exit(0);
  }
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("[migrate] Schema applied successfully.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("[migrate] failed:", err.message);
  process.exit(1);
});
