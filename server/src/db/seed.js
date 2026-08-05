import bcrypt from "bcryptjs";
import { getPool, query } from "./pool.js";
import {
  ALL_SEED_ACCOUNTS,
  SAMPLE_PROGRESS,
  SAMPLE_SIM_EVENTS,
  completedAtFromMonthsAgo,
} from "./seedData.js";

async function seed() {
  const pool = getPool();
  if (!pool) {
    console.log("[seed] No DATABASE_URL — memory store already has demo accounts.");
    process.exit(0);
  }

  const userIdByUsername = new Map();

  for (const u of ALL_SEED_ACCOUNTS) {
    const hash = await bcrypt.hash(u.password, 10);
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, display_name, rank, unit, department, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         rank = EXCLUDED.rank,
         unit = EXCLUDED.unit,
         department = EXCLUDED.department,
         role = EXCLUDED.role,
         is_active = TRUE
       RETURNING id, username`,
      [u.username, hash, u.displayName, u.rank, u.unit, u.department, u.role]
    );
    userIdByUsername.set(rows[0].username, rows[0].id);
  }

  for (const p of SAMPLE_PROGRESS) {
    const userId = userIdByUsername.get(p.username);
    if (!userId) continue;
    const completedAt = completedAtFromMonthsAgo(p.monthsAgo);
    await query(
      `INSERT INTO module_progress (user_id, module_id, completed, score, attempts, completed_at)
       VALUES ($1, $2, $3, $4, 1, $5)
       ON CONFLICT (user_id, module_id) DO UPDATE SET
         completed = EXCLUDED.completed,
         score = EXCLUDED.score,
         attempts = GREATEST(module_progress.attempts, 1),
         completed_at = COALESCE(module_progress.completed_at, EXCLUDED.completed_at),
         updated_at = NOW()`,
      [userId, p.moduleId, p.completed, p.score, completedAt]
    );
  }

  // Clear prior seed sim events for seeded users, then insert count-only events
  for (const ev of SAMPLE_SIM_EVENTS) {
    const userId = userIdByUsername.get(ev.username);
    if (!userId) continue;
    const n = Math.max(1, ev.count || 1);
    for (let i = 0; i < n; i++) {
      await query(
        `INSERT INTO sim_events (user_id, module_id, kind) VALUES ($1, $2, $3)`,
        [userId, ev.moduleId, ev.kind]
      );
    }
  }

  console.log(
    `[seed] Loaded ${ALL_SEED_ACCOUNTS.length} training accounts, ${SAMPLE_PROGRESS.length} progress rows, sim event samples.`
  );
  console.log("[seed] NOTE: These are DEMO passwords only — not real credentials.");
  await pool.end();
}

seed().catch((err) => {
  console.error("[seed] failed:", err.message);
  process.exit(1);
});
