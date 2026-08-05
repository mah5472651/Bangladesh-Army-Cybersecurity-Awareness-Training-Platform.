/**
 * In-memory store used when PostgreSQL is unavailable.
 * Same safety rules: never store simulation credentials.
 */
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  ALL_SEED_ACCOUNTS,
  SAMPLE_PROGRESS,
  SAMPLE_SIM_EVENTS,
  completedAtFromMonthsAgo,
} from "./seedData.js";

function createStore() {
  const users = ALL_SEED_ACCOUNTS.map((u) => ({
    id: `u-${u.username}`,
    username: u.username,
    passwordHash: bcrypt.hashSync(u.password, 10),
    displayName: u.displayName,
    rank: u.rank,
    unit: u.unit,
    department: u.department,
    role: u.role,
    isActive: true,
    lastLoginAt: null,
  }));

  const usernameToId = new Map(users.map((u) => [u.username, u.id]));
  const progress = new Map();
  const badges = new Map();
  const simEvents = [];

  for (const p of SAMPLE_PROGRESS) {
    const userId = usernameToId.get(p.username);
    if (!userId) continue;
    if (!progress.has(userId)) progress.set(userId, new Map());
    progress.get(userId).set(p.moduleId, {
      moduleId: p.moduleId,
      completed: Boolean(p.completed),
      score: p.score,
      attempts: 1,
      completedAt: completedAtFromMonthsAgo(p.monthsAgo),
    });
  }

  for (const ev of SAMPLE_SIM_EVENTS) {
    const userId = usernameToId.get(ev.username);
    if (!userId) continue;
    const n = Math.max(1, ev.count || 1);
    for (let i = 0; i < n; i++) {
      simEvents.push({
        id: randomUUID(),
        userId,
        kind: ev.kind,
        moduleId: ev.moduleId,
        createdAt: completedAtFromMonthsAgo(0),
      });
    }
  }

  return {
    users,
    sessions: new Map(),
    progress,
    simEvents,
    badges,
    auditLogs: [
      {
        id: randomUUID(),
        userId: null,
        username: "system",
        action: "store_init",
        detail: `Memory store seeded with ${users.length} training accounts (demo only)`,
        ipAddress: "local",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export const memory = createStore();

export function memFindUserByUsername(username) {
  return memory.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
}

export function memFindUserById(id) {
  return memory.users.find((u) => u.id === id);
}

export function memCreateUser({
  username,
  passwordHash,
  displayName,
  rank,
  unit,
  department,
  role,
}) {
  if (memFindUserByUsername(username)) {
    throw new Error("Username already exists");
  }
  const user = {
    id: `u-${username}-${randomUUID().slice(0, 8)}`,
    username,
    passwordHash,
    displayName,
    rank,
    unit,
    department: department || "Other",
    role,
    isActive: true,
    lastLoginAt: null,
  };
  memory.users.push(user);
  return user;
}

export function memUpdateUser(username, patch) {
  const u = memFindUserByUsername(username);
  if (!u) return null;
  if (patch.displayName !== undefined) u.displayName = patch.displayName;
  if (patch.rank !== undefined) u.rank = patch.rank;
  if (patch.unit !== undefined) u.unit = patch.unit;
  if (patch.department !== undefined) u.department = patch.department;
  if (patch.role !== undefined) u.role = patch.role;
  if (patch.isActive !== undefined) u.isActive = Boolean(patch.isActive);
  if (patch.passwordHash !== undefined) u.passwordHash = patch.passwordHash;
  return u;
}

export function memCreateSession(userId, tokenHash, expiresAt, meta = {}) {
  const id = randomUUID();
  memory.sessions.set(tokenHash, {
    id,
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    ...meta,
  });
  return id;
}

export function memGetSession(tokenHash) {
  const s = memory.sessions.get(tokenHash);
  if (!s) return null;
  if (new Date(s.expiresAt) < new Date()) {
    memory.sessions.delete(tokenHash);
    return null;
  }
  return s;
}

export function memDeleteSession(tokenHash) {
  memory.sessions.delete(tokenHash);
}

export function memGetProgress(userId) {
  if (!memory.progress.has(userId)) memory.progress.set(userId, new Map());
  return Array.from(memory.progress.get(userId).values());
}

export function memSaveProgress(userId, moduleId, { score, completed }) {
  if (!memory.progress.has(userId)) memory.progress.set(userId, new Map());
  const map = memory.progress.get(userId);
  const existing = map.get(moduleId) || {
    moduleId,
    completed: false,
    score: 0,
    attempts: 0,
  };
  const nextScore =
    typeof score === "number" ? Math.max(existing.score || 0, score) : existing.score;
  const next = {
    moduleId,
    completed: Boolean(completed) || existing.completed,
    score: nextScore,
    attempts: existing.attempts + 1,
    completedAt:
      completed || existing.completed
        ? existing.completedAt || new Date().toISOString()
        : undefined,
  };
  map.set(moduleId, next);
  return next;
}

export function memRecordSimEvent(userId, kind, moduleId) {
  memory.simEvents.push({
    id: randomUUID(),
    userId,
    kind,
    moduleId,
    createdAt: new Date().toISOString(),
  });
}

export function memAudit(entry) {
  memory.auditLogs.unshift({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  });
  if (memory.auditLogs.length > 500) memory.auditLogs.length = 500;
}

export function memXp(userId) {
  const items = memGetProgress(userId);
  return items.reduce((s, p) => s + (p.completed ? 100 + Math.round(p.score * 0.5) : 0), 0);
}

export function memBadges(userId) {
  return Array.from(memory.badges.get(userId) || []);
}

export function memAddBadge(userId, badgeId) {
  if (!memory.badges.has(userId)) memory.badges.set(userId, new Set());
  memory.badges.get(userId).add(badgeId);
}

export function memListDepartments() {
  const set = new Set(
    memory.users.map((u) => u.department || "Other").filter(Boolean)
  );
  return Array.from(set).sort();
}
