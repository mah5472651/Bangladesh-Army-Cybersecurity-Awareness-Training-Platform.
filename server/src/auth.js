import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "crypto";
import { getPool, query } from "./db/pool.js";
import {
  memFindUserByUsername,
  memFindUserById,
  memCreateSession,
  memGetSession,
  memDeleteSession,
  memAudit,
} from "./db/memoryStore.js";
import { isExternalEmail, clientIp, issueCsrfToken, storeCsrfToken, enforceBoundCsrf } from "./security.js";

const JWT_SECRET = process.env.JWT_SECRET || "ba-cyber-training-dev-secret-change-me";
const TOKEN_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 8);

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(u) {
  return {
    username: u.username,
    displayName: u.displayName || u.display_name,
    rank: u.rank,
    unit: u.unit,
    role: u.role,
    department: u.department,
  };
}

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

export async function loginHandler(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (isExternalEmail(username)) {
    await audit(null, username, "login_rejected", "external_email", req);
    return res.status(403).json({
      error:
        "External email providers are not permitted. Use training accounts only (e.g. trainee001).",
    });
  }

  if (
    typeof username === "string" &&
    username.includes("@") &&
    !username.toLowerCase().endsWith(".training.local")
  ) {
    await audit(null, username, "login_rejected", "non_training_email", req);
    return res.status(403).json({
      error: "Only internal training accounts are accepted. Do not use real email addresses.",
    });
  }

  let user = null;
  let passwordOk = false;

  if (getPool()) {
    const { rows } = await query(
      `SELECT id, username, password_hash, display_name, rank, unit, department, role, is_active
       FROM users WHERE lower(username) = lower($1)`,
      [username.trim()]
    );
    user = rows[0];
    if (user && user.is_active) {
      passwordOk = await bcrypt.compare(password, user.password_hash);
    }
  } else {
    user = memFindUserByUsername(username);
    if (user && user.isActive) {
      passwordOk = await bcrypt.compare(password, user.passwordHash);
    }
  }

  if (!user || !passwordOk) {
    await audit(null, username, "login_failed", "invalid_credentials", req);
    return res.status(401).json({
      error: "Invalid training credentials. Use demo accounts listed on the login page.",
    });
  }

  const userId = user.id;
  const token = jwt.sign(
    { sub: userId, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: `${TOKEN_TTL_HOURS}h`, jwtid: randomUUID() }
  );
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000);

  if (getPool()) {
    await query(
      `INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        tokenHash,
        expiresAt.toISOString(),
        clientIp(req),
        (req.headers["user-agent"] || "").slice(0, 500),
      ]
    );
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);
  } else {
    memCreateSession(userId, tokenHash, expiresAt, {
      ipAddress: clientIp(req),
      userAgent: (req.headers["user-agent"] || "").slice(0, 500),
    });
    user.lastLoginAt = new Date().toISOString();
  }

  await audit(userId, user.username, "login_success", "training_session", req);

  // Password from request body is never logged or stored beyond bcrypt compare
  const csrfToken = issueCsrfToken();
  await storeCsrfToken(csrfToken, userId);
  return res.json({
    token,
    csrfToken,
    user: publicUser(user),
  });
}

export async function logoutHandler(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    const tokenHash = hashToken(token);
    if (getPool()) {
      await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
    } else {
      memDeleteSession(tokenHash);
    }
  }
  if (req.user) {
    await audit(req.user.id, req.user.username, "logout", null, req);
  }
  return res.json({ ok: true });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const tokenHash = hashToken(token);

    if (getPool()) {
      const { rows } = await query(
        `SELECT s.id AS session_id, u.id, u.username, u.display_name, u.rank, u.unit, u.department, u.role, u.is_active
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
        [tokenHash]
      );
      if (!rows[0] || !rows[0].is_active) {
        return res.status(401).json({ error: "Session expired or invalid." });
      }
      req.user = {
        id: rows[0].id,
        username: rows[0].username,
        displayName: rows[0].display_name,
        rank: rows[0].rank,
        unit: rows[0].unit,
        department: rows[0].department,
        role: rows[0].role,
      };
    } else {
      const session = memGetSession(tokenHash);
      if (!session || session.userId !== payload.sub) {
        return res.status(401).json({ error: "Session expired or invalid." });
      }
      const u = memFindUserById(session.userId);
      if (!u || !u.isActive) {
        return res.status(401).json({ error: "Session expired or invalid." });
      }
      req.user = {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        rank: u.rank,
        unit: u.unit,
        department: u.department,
        role: u.role,
      };
    }
    // Enforce server-bound CSRF on authenticated mutations
    return enforceBoundCsrf(req, res, next);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient privileges for this training role." });
    }
    next();
  };
}
