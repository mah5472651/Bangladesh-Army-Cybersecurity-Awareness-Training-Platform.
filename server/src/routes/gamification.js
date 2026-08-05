import { Router } from "express";
import { getPool, query } from "../db/pool.js";
import { memory, memGetProgress, memXp } from "../db/memoryStore.js";
import { requireAuth } from "../auth.js";

const router = Router();

function levelFromXp(xp) {
  if (xp >= 2000) return 5;
  if (xp >= 1200) return 4;
  if (xp >= 700) return 3;
  if (xp >= 300) return 2;
  return 1;
}

router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    let entries = [];

    if (getPool()) {
      const { rows } = await query(
        `SELECT u.username, u.display_name, u.rank, u.unit,
                COALESCE(SUM(
                  CASE WHEN mp.completed THEN 100 + ROUND(mp.score * 0.5) ELSE 0 END
                ), 0)::int AS xp
         FROM users u
         LEFT JOIN module_progress mp ON mp.user_id = u.id
         WHERE u.role = 'trainee' AND u.is_active = TRUE
         GROUP BY u.id
         ORDER BY xp DESC
         LIMIT 50`
      );
      entries = rows.map((r) => ({
        username: r.username,
        displayName: r.display_name,
        xp: r.xp,
        level: levelFromXp(r.xp),
        rank: r.rank,
        unit: r.unit,
      }));
    } else {
      entries = memory.users
        .filter((u) => u.role === "trainee")
        .map((u) => {
          const xp = memXp(u.id);
          return {
            username: u.username,
            displayName: u.displayName,
            xp,
            level: levelFromXp(xp),
            rank: u.rank,
            unit: u.unit,
          };
        })
        .sort((a, b) => b.xp - a.xp);
    }

    // Enrich with local sample if empty
    if (entries.length === 0) {
      entries = [
        {
          username: "trainee001",
          displayName: "Corporal Rahman",
          xp: 320,
          level: 2,
          rank: "Cpl",
          unit: "Signals Battalion",
        },
        {
          username: "trainee002",
          displayName: "Lance Naik Karim",
          xp: 140,
          level: 1,
          rank: "L/Nk",
          unit: "Infantry Regiment",
        },
      ];
    }

    return res.json({ entries });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
