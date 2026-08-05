import { Router } from "express";
import bcrypt from "bcryptjs";
import { getPool, query } from "../db/pool.js";
import {
  memory,
  memCreateUser,
  memUpdateUser,
  memFindUserByUsername,
  memResetProgress,
  memAudit,
} from "../db/memoryStore.js";
import { requireAuth, requireRole } from "../auth.js";
import { clientIp } from "../security.js";

const router = Router();

const ALLOWED_ROLES = ["trainee", "instructor", "admin"];

async function audit(userId, username, action, detail, req) {
  const ip = clientIp(req);
  if (getPool()) {
    try {
      await query(
        `INSERT INTO audit_logs (user_id, username, action, detail, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, username, action, detail, ip]
      );
    } catch {
      /* non-fatal */
    }
  } else {
    memAudit({ userId, username, action, detail, ipAddress: ip });
  }
}

router.get("/stats", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    if (getPool()) {
      const { rows: users } = await query(
        `SELECT username, display_name AS "displayName", rank, unit, department, role,
                last_login_at AS "lastLoginAt", is_active AS "isActive"
         FROM users ORDER BY role, username`
      );
      const { rows: auditLogs } = await query(
        `SELECT id::text, username, action, detail, ip_address AS "ipAddress",
                created_at AS "createdAt"
         FROM audit_logs ORDER BY created_at DESC LIMIT 50`
      );
      const { rows: counts } = await query(
        `SELECT
           (SELECT COUNT(*)::int FROM users) AS total_users,
           (SELECT COUNT(*)::int FROM users WHERE role = 'trainee') AS trainees,
           (SELECT COUNT(*)::int FROM module_progress WHERE completed = TRUE) AS completions,
           (SELECT COUNT(*)::int FROM sim_events) AS sim_events,
           (SELECT COUNT(*)::int FROM sessions WHERE expires_at > NOW()) AS active_sessions`
      );
      return res.json({
        users,
        auditLogs: auditLogs.map((a) => ({
          id: a.id,
          time: a.createdAt,
          actor: a.username,
          action: a.action,
          detail: a.detail,
          ipAddress: a.ipAddress,
        })),
        summary: {
          totalUsers: counts[0].total_users,
          users: counts[0].total_users,
          trainees: counts[0].trainees,
          completions: counts[0].completions,
          simEvents: counts[0].sim_events,
          activeSessions: counts[0].active_sessions,
          modules: 8,
          auditEvents: auditLogs.length,
        },
        note: "Audit logs never contain passwords or credential values.",
      });
    }

    const users = memory.users.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      rank: u.rank,
      unit: u.unit,
      department: u.department,
      role: u.role,
      lastLoginAt: u.lastLoginAt,
      isActive: u.isActive,
    }));

    return res.json({
      users,
      auditLogs: memory.auditLogs.slice(0, 50).map((a) => ({
        id: a.id,
        time: a.createdAt,
        actor: a.username,
        action: a.action,
        detail: a.detail,
        ipAddress: a.ipAddress,
      })),
      summary: {
        totalUsers: memory.users.length,
        users: memory.users.length,
        trainees: memory.users.filter((u) => u.role === "trainee").length,
        completions: Array.from(memory.progress.values()).reduce(
          (s, map) => s + Array.from(map.values()).filter((p) => p.completed).length,
          0
        ),
        simEvents: memory.simEvents.length,
        activeSessions: memory.sessions.size,
        modules: 8,
        auditEvents: memory.auditLogs.length,
      },
      note: "Audit logs never contain passwords or credential values.",
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** List all users (admin) */
router.get("/users", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    if (getPool()) {
      const { rows } = await query(
        `SELECT username, display_name AS "displayName", rank, unit, department, role,
                is_active AS "isActive", last_login_at AS "lastLoginAt", created_at AS "createdAt"
         FROM users ORDER BY role, username`
      );
      return res.json({ users: rows });
    }
    return res.json({
      users: memory.users.map((u) => ({
        username: u.username,
        displayName: u.displayName,
        rank: u.rank,
        unit: u.unit,
        department: u.department,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** Create training user */
router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      username,
      password,
      displayName,
      rank = "Pte",
      unit = "Unassigned",
      department = "Other",
      role = "trainee",
    } = req.body || {};

    if (!username || !password || !displayName) {
      return res.status(400).json({
        error: "username, password, and displayName are required.",
      });
    }
    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username)) {
      return res.status(400).json({
        error: "Username must be 3–64 chars: letters, numbers, . _ - only.",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }
    if (username.includes("@")) {
      return res.status(400).json({ error: "Use training usernames, not email addresses." });
    }

    const hash = await bcrypt.hash(password, 10);

    if (getPool()) {
      try {
        await query(
          `INSERT INTO users (username, password_hash, display_name, rank, unit, department, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [username, hash, displayName, rank, unit, department, role]
        );
      } catch (err) {
        if (err.code === "23505") {
          return res.status(409).json({ error: "Username already exists." });
        }
        throw err;
      }
    } else {
      try {
        memCreateUser({
          username,
          passwordHash: hash,
          displayName,
          rank,
          unit,
          department,
          role,
        });
      } catch (err) {
        return res.status(409).json({ error: err.message });
      }
    }

    await audit(req.user.id, req.user.username, "USER_CREATE", `Created ${username} (${role})`, req);
    return res.status(201).json({
      ok: true,
      user: { username, displayName, rank, unit, department, role, isActive: true },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** Update user (disable, department, unit, role, reset password) */
router.patch("/users/:username", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { username } = req.params;
    const { displayName, rank, unit, department, role, isActive, password } = req.body || {};

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    let passwordHash;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (getPool()) {
      const { rows: existing } = await query(
        `SELECT id, username FROM users WHERE lower(username) = lower($1)`,
        [username]
      );
      if (!existing[0]) return res.status(404).json({ error: "User not found." });

      await query(
        `UPDATE users SET
           display_name = COALESCE($2, display_name),
           rank = COALESCE($3, rank),
           unit = COALESCE($4, unit),
           department = COALESCE($5, department),
           role = COALESCE($6, role),
           is_active = COALESCE($7, is_active),
           password_hash = COALESCE($8, password_hash)
         WHERE id = $1`,
        [
          existing[0].id,
          displayName ?? null,
          rank ?? null,
          unit ?? null,
          department ?? null,
          role ?? null,
          typeof isActive === "boolean" ? isActive : null,
          passwordHash ?? null,
        ]
      );

      // Revoke sessions if disabled
      if (isActive === false) {
        await query(`DELETE FROM sessions WHERE user_id = $1`, [existing[0].id]);
      }

      const { rows } = await query(
        `SELECT username, display_name AS "displayName", rank, unit, department, role,
                is_active AS "isActive"
         FROM users WHERE id = $1`,
        [existing[0].id]
      );
      await audit(
        req.user.id,
        req.user.username,
        "USER_UPDATE",
        `Updated ${username}` + (isActive === false ? " (disabled)" : ""),
        req
      );
      return res.json({ ok: true, user: rows[0] });
    }

    const u = memFindUserByUsername(username);
    if (!u) return res.status(404).json({ error: "User not found." });
    const updated = memUpdateUser(username, {
      displayName,
      rank,
      unit,
      department,
      role,
      isActive,
      passwordHash,
    });
    if (isActive === false) {
      for (const [hash, sess] of memory.sessions.entries()) {
        if (sess.userId === u.id) memory.sessions.delete(hash);
      }
    }
    await audit(req.user.id, req.user.username, "USER_UPDATE", `Updated ${username}`, req);
    return res.json({
      ok: true,
      user: {
        username: updated.username,
        displayName: updated.displayName,
        rank: updated.rank,
        unit: updated.unit,
        department: updated.department,
        role: updated.role,
        isActive: updated.isActive,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** Reset module progress + badges + sim events for a trainee */
router.post(
  "/users/:username/reset-progress",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { username } = req.params;

      if (getPool()) {
        const { rows } = await query(
          `SELECT id FROM users WHERE lower(username) = lower($1)`,
          [username]
        );
        if (!rows[0]) return res.status(404).json({ error: "User not found." });
        const userId = rows[0].id;
        await query(`DELETE FROM module_progress WHERE user_id = $1`, [userId]);
        await query(`DELETE FROM user_badges WHERE user_id = $1`, [userId]);
        await query(`DELETE FROM sim_events WHERE user_id = $1`, [userId]);
        await query(`DELETE FROM certificates WHERE user_id = $1`, [userId]).catch(() => {});
      } else {
        const u = memFindUserByUsername(username);
        if (!u) return res.status(404).json({ error: "User not found." });
        memResetProgress(u.id);
      }

      await audit(
        req.user.id,
        req.user.username,
        "PROGRESS_RESET",
        `Reset progress for ${username}`,
        req
      );
      return res.json({ ok: true, message: `Progress reset for ${username}.` });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
);

export default router;
