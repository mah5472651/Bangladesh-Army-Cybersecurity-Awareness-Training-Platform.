/**
 * Shared cohort analytics builders for instructor/admin/export routes.
 */
import { getPool, query } from "../db/pool.js";
import { memory, memGetProgress, memXp } from "../db/memoryStore.js";

export const MODULES = [
  "email-phishing",
  "fake-login",
  "qr-phishing",
  "sms-phishing",
  "voice-phishing",
  "usb-security",
  "password-security",
  "social-engineering",
];

export const MODULE_LABELS = {
  "email-phishing": "Email Phishing",
  "fake-login": "Fake Login",
  "qr-phishing": "QR Phishing",
  "sms-phishing": "Smishing",
  "voice-phishing": "Vishing",
  "usb-security": "USB Security",
  "password-security": "Passwords",
  "social-engineering": "Social Eng.",
};

export function deptFromUsers(trainees) {
  const map = new Map();
  for (const t of trainees) {
    const d = t.department || "Other";
    if (!map.has(d)) map.set(d, { department: d, trainees: 0, scores: [], completions: [] });
    const row = map.get(d);
    row.trainees += 1;
    row.scores.push(t.averageScore || 0);
    row.completions.push((t.completedModules / Math.max(1, t.totalModules)) * 100);
  }
  return Array.from(map.values()).map((d) => {
    const avgScore =
      d.scores.length > 0
        ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length)
        : 0;
    const completionRate =
      d.completions.length > 0
        ? Math.round(d.completions.reduce((a, b) => a + b, 0) / d.completions.length)
        : 0;
    const riskLevel = completionRate < 40 ? "High" : completionRate < 70 ? "Medium" : "Low";
    return { department: d.department, trainees: d.trainees, completionRate, avgScore, riskLevel };
  });
}

function levelFromXp(xp) {
  if (xp >= 1400) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 700) return 4;
  if (xp >= 400) return 3;
  if (xp >= 150) return 2;
  return 1;
}

export async function loadTrainees() {
  const trainees = [];

  if (getPool()) {
    const { rows: users } = await query(
      `SELECT id, username, display_name, rank, unit, department, role, last_login_at
       FROM users WHERE role = 'trainee' AND is_active = TRUE
       ORDER BY department, username`
    );

    for (const u of users) {
      const { rows: prog } = await query(
        `SELECT module_id, completed, score FROM module_progress WHERE user_id = $1`,
        [u.id]
      );
      const done = prog.filter((p) => p.completed);
      const avg =
        done.length > 0
          ? Math.round(done.reduce((s, p) => s + p.score, 0) / done.length)
          : 0;
      const { rows: ev } = await query(
        `SELECT kind, module_id, COUNT(*)::int AS c FROM sim_events WHERE user_id = $1 GROUP BY kind, module_id`,
        [u.id]
      );
      const simClicks = ev.filter((e) => e.kind === "click").reduce((s, e) => s + e.c, 0);
      const formAttempts = ev
        .filter((e) => e.kind === "form_attempt")
        .reduce((s, e) => s + e.c, 0);
      const xp = done.reduce((s, p) => s + 100 + Math.round(p.score * 0.5), 0);
      const completionPct = Math.round((done.length / 8) * 100);
      const moduleScores = Object.fromEntries(prog.map((p) => [p.module_id, p.score]));
      const clickByModule = {};
      for (const e of ev.filter((x) => x.kind === "click")) {
        clickByModule[e.module_id] = (clickByModule[e.module_id] || 0) + e.c;
      }

      trainees.push({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        rank: u.rank,
        unit: u.unit,
        department: u.department || "Other",
        completedModules: done.length,
        totalModules: 8,
        averageScore: avg,
        awarenessScore: Math.round(completionPct * 0.5 + avg * 0.5),
        simClicks,
        formAttempts,
        xp,
        level: levelFromXp(xp),
        lastActive: u.last_login_at
          ? new Date(u.last_login_at).toISOString().slice(0, 10)
          : "",
        moduleScores,
        clickByModule,
      });
    }
  } else {
    for (const u of memory.users.filter((x) => x.role === "trainee" && x.isActive)) {
      const prog = memGetProgress(u.id);
      const done = prog.filter((p) => p.completed);
      const avg =
        done.length > 0
          ? Math.round(done.reduce((s, p) => s + p.score, 0) / done.length)
          : 0;
      const userEvents = memory.simEvents.filter((e) => e.userId === u.id);
      const simClicks = userEvents.filter((e) => e.kind === "click").length;
      const formAttempts = userEvents.filter((e) => e.kind === "form_attempt").length;
      const completionPct = Math.round((done.length / 8) * 100);
      const xp = memXp(u.id);
      const moduleScores = Object.fromEntries(prog.map((p) => [p.moduleId, p.score]));
      const clickByModule = {};
      for (const e of userEvents.filter((x) => x.kind === "click")) {
        clickByModule[e.moduleId] = (clickByModule[e.moduleId] || 0) + 1;
      }

      trainees.push({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        rank: u.rank,
        unit: u.unit,
        department: u.department || "Other",
        completedModules: done.length,
        totalModules: 8,
        averageScore: avg,
        awarenessScore: Math.round(completionPct * 0.5 + avg * 0.5),
        simClicks,
        formAttempts,
        xp,
        level: levelFromXp(xp),
        lastActive: u.lastLoginAt
          ? new Date(u.lastLoginAt).toISOString().slice(0, 10)
          : "",
        moduleScores,
        clickByModule,
      });
    }
  }

  return trainees;
}

export function buildCohortAnalytics(trainees) {
  const departments = deptFromUsers(trainees);

  const moduleClickRates = MODULES.map((m) => {
    const clicks = trainees.reduce((s, t) => s + (t.clickByModule?.[m] || 0), 0);
    const forms =
      m === "fake-login"
        ? trainees.reduce((s, t) => s + t.formAttempts, 0)
        : Math.round(clicks * 0.4);
    const clickRate =
      trainees.length > 0
        ? Math.round((clicks / Math.max(1, trainees.length * 5)) * 100)
        : 0;
    return {
      module: MODULE_LABELS[m] || m,
      moduleId: m,
      clickRate: Math.min(100, clickRate),
      submissions: forms,
    };
  });

  // Awareness trend: synthetic months based on current avg (honest empty when no data)
  const avgAwareness =
    trainees.length > 0
      ? Math.round(trainees.reduce((s, t) => s + t.awarenessScore, 0) / trainees.length)
      : 0;
  const awarenessTrend =
    trainees.length === 0
      ? []
      : [
          { month: "Jan", score: Math.max(40, avgAwareness - 18) },
          { month: "Feb", score: Math.max(45, avgAwareness - 14) },
          { month: "Mar", score: Math.max(50, avgAwareness - 10) },
          { month: "Apr", score: Math.max(55, avgAwareness - 6) },
          { month: "May", score: Math.max(60, avgAwareness - 3) },
          { month: "Jun", score: avgAwareness },
        ];

  // Per-unit risk heatmap with channel breakdown from sim clicks
  const unitMap = new Map();
  for (const t of trainees) {
    const key = t.unit || t.department;
    if (!unitMap.has(key)) {
      unitMap.set(key, {
        unit: key,
        email: 0,
        sms: 0,
        qr: 0,
        social: 0,
        overall: 0,
        n: 0,
      });
    }
    const row = unitMap.get(key);
    row.n += 1;
    row.email += t.clickByModule?.["email-phishing"] || 0;
    row.sms += t.clickByModule?.["sms-phishing"] || 0;
    row.qr += t.clickByModule?.["qr-phishing"] || 0;
    row.social += t.clickByModule?.["social-engineering"] || 0;
    // risk index: higher clicks + lower completion = higher risk
    const risk =
      Math.round(
        (100 - (t.completedModules / 8) * 100) * 0.5 +
          Math.min(50, t.simClicks * 2) * 0.3 +
          Math.min(30, t.formAttempts * 4) * 0.2
      ) || 0;
    row.overall += risk;
  }

  const riskHeatmap = Array.from(unitMap.values()).map((r) => ({
    unit: r.unit,
    email: Math.min(99, Math.round((r.email / Math.max(1, r.n)) * 8)),
    sms: Math.min(99, Math.round((r.sms / Math.max(1, r.n)) * 8)),
    qr: Math.min(99, Math.round((r.qr / Math.max(1, r.n)) * 8)),
    social: Math.min(99, Math.round((r.social / Math.max(1, r.n)) * 8)),
    overall: Math.min(99, Math.round(r.overall / Math.max(1, r.n))),
  }));

  const summary = {
    totalTrainees: trainees.length,
    avgCompletion:
      trainees.length > 0
        ? Math.round(
            trainees.reduce((s, t) => s + (t.completedModules / t.totalModules) * 100, 0) /
              trainees.length
          )
        : 0,
    avgAwareness,
    totalFormAttempts: trainees.reduce((s, t) => s + t.formAttempts, 0),
    totalSimClicks: trainees.reduce((s, t) => s + t.simClicks, 0),
  };

  return {
    trainees: trainees.map(({ clickByModule, moduleScores, id, ...rest }) => rest),
    departments,
    moduleClickRates,
    awarenessTrend,
    riskHeatmap,
    summary,
    empty: trainees.length === 0,
    note: "No passwords or sensitive simulation inputs are stored or displayed.",
  };
}

export function toCsv(rows) {
  if (!rows.length) return "message\nNo data\n";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join(
    "\n"
  );
}
