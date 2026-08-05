/**
 * Security helpers for the training platform.
 * Simulation forms never reach this API with raw passwords —
 * the frontend discards them client-side. Server also refuses
 * any payload that looks like credential capture.
 */
import { randomUUID } from "crypto";
import { getPool, query } from "./db/pool.js";
import { memStoreCsrf, memValidateCsrf } from "./db/memoryStore.js";

const BLOCKED_BODY_KEYS = [
  "password",
  "passwd",
  "pwd",
  "secret",
  "credential",
  "credentials",
  "ssn",
  "credit_card",
  "creditcard",
  "card_number",
];

const EXTERNAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "protonmail.com",
  "mail.com",
];

const WEAK_JWT_SECRETS = [
  "ba-cyber-training-dev-secret-change-me",
  "change-this-jwt-secret-in-production-ba-cyber",
  "dev-secret",
  "secret",
  "changeme",
  "change-me",
];

export function isExternalEmail(value) {
  if (!value || typeof value !== "string") return false;
  const lower = value.toLowerCase();
  if (!lower.includes("@")) return false;
  return EXTERNAL_EMAIL_DOMAINS.some(
    (d) => lower.endsWith("@" + d) || lower.includes("@" + d)
  );
}

/** Fail boot in production if secrets are missing or default */
export function assertProductionSecrets() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return;

  const jwt = process.env.JWT_SECRET || "";
  const errors = [];

  if (!jwt || jwt.length < 32) {
    errors.push("JWT_SECRET must be set and at least 32 characters in production.");
  }
  if (WEAK_JWT_SECRETS.includes(jwt) || /change.?me|changeme|default|example/i.test(jwt)) {
    errors.push("JWT_SECRET appears to be a default/dev value — refuse to start in production.");
  }

  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl && /ChangeMeInProduction|postgres:postgres@|password=password/i.test(dbUrl)) {
    errors.push("DATABASE_URL appears to use a default password — set a strong POSTGRES_PASSWORD.");
  }

  if (process.env.ALLOW_INSECURE_SECRETS === "1") {
    console.warn("[security] ALLOW_INSECURE_SECRETS=1 — skipping secret enforcement (NOT for real deploys).");
    return;
  }

  if (errors.length) {
    console.error("[security] Production secret check failed:");
    errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }
}

/** Middleware: reject bodies that attempt to store real credentials */
export function rejectCredentialPayload(req, res, next) {
  if (!req.body || typeof req.body !== "object") return next();

  // Login + admin user create/update are the only places that accept a password field
  const url = req.originalUrl || req.path || "";
  const isLogin = url.endsWith("/auth/login");
  const isAdminUserWrite =
    url.includes("/api/admin/users") &&
    (req.method === "POST" || req.method === "PATCH");

  for (const key of Object.keys(req.body)) {
    const lower = key.toLowerCase();
    if (BLOCKED_BODY_KEYS.includes(lower)) {
      if ((isLogin || isAdminUserWrite) && lower === "password") continue;
      return res.status(400).json({
        error:
          "Credential-like fields are not accepted. This is a training platform and never stores simulation passwords.",
      });
    }
  }
  next();
}

export function clientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Store a server-bound CSRF token for the authenticated user.
 */
export async function storeCsrfToken(token, userId) {
  const expiresAt = new Date(Date.now() + 8 * 3600 * 1000);
  if (getPool()) {
    try {
      await query(
        `INSERT INTO csrf_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)
         ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at`,
        [token, userId, expiresAt.toISOString()]
      );
      // Opportunistic cleanup
      await query(`DELETE FROM csrf_tokens WHERE expires_at < NOW()`).catch(() => {});
    } catch {
      // Table may be missing on first boot before migrate — fall back to memory
      memStoreCsrf(token, userId);
    }
  } else {
    memStoreCsrf(token, userId);
  }
}

async function validateStoredCsrf(token, userId) {
  if (getPool()) {
    try {
      const { rows } = await query(
        `SELECT token FROM csrf_tokens
         WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
        [token, userId]
      );
      if (rows[0]) return true;
    } catch {
      /* fall through to memory */
    }
  }
  return memValidateCsrf(token, userId);
}

/**
 * CSRF double-submit with server-side token store.
 * Login is exempt (establishes session + issues token).
 * Requires X-CSRF-Token header matching a token issued for this user.
 */
export function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

  const url = req.originalUrl || "";
  if (url.includes("/auth/login")) return next();
  // Public certificate verification is GET only; POST cert requires auth+csrf

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return next();

  const headerToken = req.headers["x-csrf-token"];
  if (!headerToken || typeof headerToken !== "string" || headerToken.length < 8) {
    return res.status(403).json({
      error:
        "Missing or invalid CSRF token. Include X-CSRF-Token header for authenticated mutations.",
    });
  }
  if (headerToken.length > 128) {
    return res.status(403).json({ error: "Invalid CSRF token." });
  }

  // Defer user binding check until after requireAuth sets req.user —
  // we validate loosely here (format) and tightly in csrfValidateBound when user is known.
  // For routes that use requireAuth, attach async check:
  req.csrfToken = headerToken;
  req.validateCsrf = async (userId) => validateStoredCsrf(headerToken, userId);

  // Async validation if user already present (middleware order: csrf before routes)
  // Full bind check happens in requireAuth wrapper below via attachCsrfUserCheck
  next();
}

/** Call after requireAuth to enforce server-bound CSRF on mutations */
export async function enforceBoundCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();
  if (!req.user) return next();
  if (!req.csrfToken) {
    return res.status(403).json({ error: "Missing CSRF token." });
  }
  const ok = await validateStoredCsrf(req.csrfToken, req.user.id);
  if (!ok) {
    // Dev-friendly: if token was client-generated before login fixed, still require presence
    // but prefer server-issued. Reject unbound tokens in production.
    if (process.env.NODE_ENV === "production" || process.env.STRICT_CSRF === "1") {
      return res.status(403).json({
        error: "CSRF token is not valid for this session. Re-login to obtain a fresh token.",
      });
    }
    // Non-production: accept any well-formed token that was sent (header already required)
    // but log a warning so developers know to use login-issued tokens.
    if (process.env.LOG_REQUESTS === "1") {
      console.warn("[csrf] unbound token accepted in non-production mode");
    }
  }
  next();
}

export function issueCsrfToken() {
  return randomUUID();
}

/** Basic XSS-hardening: strip script-like content from free-text string fields */
export function sanitizeStrings(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    for (const [k, v] of Object.entries(req.body)) {
      if (typeof v === "string") {
        req.body[k] = v
          .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .trim();
      }
    }
  }
  next();
}
