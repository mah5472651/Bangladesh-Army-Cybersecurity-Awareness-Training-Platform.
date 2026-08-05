import { Router } from "express";
import { getPool, query } from "../db/pool.js";
import {
  memGetProgress,
  memSaveProgress,
  memRecordSimEvent,
  memXp,
  memBadges,
  memAddBadge,
  memory,
} from "../db/memoryStore.js";
import { requireAuth } from "../auth.js";

const router = Router();

const MODULE_IDS = [
  "email-phishing",
  "fake-login",
  "qr-phishing",
  "sms-phishing",
  "voice-phishing",
  "usb-security",
  "password-security",
  "social-engineering",
];

/** Badge IDs must match frontend src/data/gamification.ts */
function evaluateBadges(completedCount, avgScore, formAttempts, moduleScores = {}) {
  const badges = [];
  if (completedCount >= 1) badges.push("first-module");
  if (completedCount >= 4) badges.push("half-way");
  if (completedCount >= 8) badges.push("full-curriculum");
  if (completedCount >= 3 && avgScore >= 85) badges.push("sharp-eye");
  if (Object.values(moduleScores).some((s) => s >= 100)) badges.push("perfect-module");
  if ((moduleScores["fake-login"] ?? 0) > 0) badges.push("sim-aware");
  if ((moduleScores["social-engineering"] ?? 0) > 0) badges.push("social-master");
  if (
    (moduleScores["email-phishing"] ?? 0) > 0 &&
    (moduleScores["sms-phishing"] ?? 0) > 0 &&
    (moduleScores["qr-phishing"] ?? 0) > 0
  ) {
    badges.push("phish-hunter");
  }
  if (formAttempts >= 1 && !badges.includes("sim-aware")) {
    // form attempt without module score still counts awareness participation
  }
  return badges;
}

function scoresMap(rows) {
  const map = {};
  for (const r of rows) {
    if (r.completed) map[r.moduleId || r.module_id] = r.score;
  }
  return map;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    if (getPool()) {
      const { rows } = await query(
        `SELECT module_id AS "moduleId", completed, score, attempts,
                completed_at AS "completedAt"
         FROM module_progress WHERE user_id = $1`,
        [req.user.id]
      );
      const { rows: events } = await query(
        `SELECT kind, COUNT(*)::int AS c FROM sim_events WHERE user_id = $1 GROUP BY kind`,
        [req.user.id]
      );
      const simClicks = events.find((e) => e.kind === "click")?.c || 0;
      const formAttempts = events.find((e) => e.kind === "form_attempt")?.c || 0;
      const simEvents = simClicks + formAttempts;
      const completed = rows.filter((r) => r.completed);
      const xp =
        completed.reduce((s, p) => s + 100 + Math.round(p.score * 0.5), 0) || 0;
      const { rows: badgeRows } = await query(
        `SELECT badge_id FROM user_badges WHERE user_id = $1`,
        [req.user.id]
      );
      return res.json({
        progress: rows,
        xp,
        badges: badgeRows.map((b) => b.badge_id),
        simEvents,
        simClicks,
        formAttempts,
      });
    }

    const progress = memGetProgress(req.user.id);
    const userEvents = memory.simEvents.filter((e) => e.userId === req.user.id);
    const simClicks = userEvents.filter((e) => e.kind === "click").length;
    const formAttempts = userEvents.filter((e) => e.kind === "form_attempt").length;
    return res.json({
      progress,
      xp: memXp(req.user.id),
      badges: memBadges(req.user.id),
      simEvents: userEvents.length,
      simClicks,
      formAttempts,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { moduleId, score, completed } = req.body || {};
    if (!moduleId || !MODULE_IDS.includes(moduleId)) {
      return res.status(400).json({ error: "Invalid module_id." });
    }
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
    const isComplete = Boolean(completed);

    if (getPool()) {
      await query(
        `INSERT INTO module_progress (user_id, module_id, completed, score, attempts, completed_at, updated_at)
         VALUES ($1, $2, $3, $4, 1, CASE WHEN $3 THEN NOW() ELSE NULL END, NOW())
         ON CONFLICT (user_id, module_id) DO UPDATE SET
           completed = module_progress.completed OR EXCLUDED.completed,
           score = GREATEST(module_progress.score, EXCLUDED.score),
           attempts = module_progress.attempts + 1,
           completed_at = COALESCE(module_progress.completed_at, EXCLUDED.completed_at),
           updated_at = NOW()`,
        [req.user.id, moduleId, isComplete, safeScore]
      );

      const { rows } = await query(
        `SELECT module_id AS "moduleId", completed, score, attempts, completed_at AS "completedAt"
         FROM module_progress WHERE user_id = $1`,
        [req.user.id]
      );
      const done = rows.filter((r) => r.completed);
      const avg =
        done.length > 0
          ? Math.round(done.reduce((s, r) => s + r.score, 0) / done.length)
          : 0;
      const { rows: fe } = await query(
        `SELECT COUNT(*)::int AS c FROM sim_events WHERE user_id = $1 AND kind = 'form_attempt'`,
        [req.user.id]
      );
      for (const b of evaluateBadges(done.length, avg, fe[0]?.c || 0, scoresMap(rows))) {
        await query(
          `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
           ON CONFLICT (user_id, badge_id) DO NOTHING`,
          [req.user.id, b]
        );
      }
      return res.json({ ok: true, progress: rows });
    }

    const item = memSaveProgress(req.user.id, moduleId, {
      score: safeScore,
      completed: isComplete,
    });
    const all = memGetProgress(req.user.id);
    const done = all.filter((r) => r.completed);
    const avg =
      done.length > 0
        ? Math.round(done.reduce((s, r) => s + r.score, 0) / done.length)
        : 0;
    const formAttempts = memory.simEvents.filter(
      (e) => e.userId === req.user.id && e.kind === "form_attempt"
    ).length;
    for (const b of evaluateBadges(done.length, avg, formAttempts, scoresMap(all))) {
      memAddBadge(req.user.id, b);
    }
    return res.json({ ok: true, progress: all, item });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
