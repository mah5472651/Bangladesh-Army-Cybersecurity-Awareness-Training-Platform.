/**
 * API client for the training backend.
 * Falls back gracefully when the API is offline (localStorage mode).
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const CSRF_KEY = "bd_army_csrf_token";

export interface ApiUser {
  username: string;
  displayName: string;
  rank: string;
  unit: string;
  role: "trainee" | "instructor" | "admin";
  department?: string;
}

export interface ApiProgressItem {
  moduleId: string;
  completed: boolean;
  score: number;
  attempts: number;
  completedAt?: string;
}

export interface AdminUser {
  username: string;
  displayName: string;
  rank: string;
  unit: string;
  department: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

function ensureCsrfToken(): string {
  let token = sessionStorage.getItem(CSRF_KEY);
  if (!token) {
    token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `csrf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(CSRF_KEY, token);
  }
  return token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; offline?: boolean; status?: number }> {
  try {
    const token = sessionStorage.getItem("bd_army_api_token");
    const method = (options.method || "GET").toUpperCase();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (!(options.body instanceof FormData) && !headers["Content-Type"] && options.body) {
      headers["Content-Type"] = "application/json";
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      headers["X-CSRF-Token"] = ensureCsrfToken();
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: (body as { error?: string }).error || res.statusText,
        status: res.status,
      };
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = (await res.json()) as T;
      return { ok: true, data };
    }
    // binary / text handled by callers via raw fetch helpers
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "API unavailable", offline: true };
  }
}

/** Download a binary/text file from an authenticated API path */
export async function apiDownload(
  path: string,
  filename: string
): Promise<{ ok: true } | { ok: false; error: string; offline?: boolean }> {
  try {
    const token = sessionStorage.getItem("bd_army_api_token");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    headers["X-CSRF-Token"] = ensureCsrfToken();

    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: (body as { error?: string }).error || res.statusText };
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: "API unavailable", offline: true };
  }
}

export async function apiLogin(username: string, password: string) {
  const result = await request<{ token: string; user: ApiUser; csrfToken?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: username.trim(), password: password.trim() }),
  });
  if (result.ok) {
    sessionStorage.setItem("bd_army_api_token", result.data.token);
    if (result.data.csrfToken) {
      sessionStorage.setItem(CSRF_KEY, result.data.csrfToken);
    } else {
      ensureCsrfToken();
    }
  }
  return result;
}

export async function apiLogout() {
  await request("/auth/logout", { method: "POST" });
  sessionStorage.removeItem("bd_army_api_token");
}

export async function apiGetProgress() {
  return request<{
    progress: ApiProgressItem[];
    xp: number;
    badges: string[];
    simEvents: number;
    formAttempts?: number;
    simClicks?: number;
  }>("/progress");
}

export async function apiSaveProgress(payload: {
  moduleId: string;
  score: number;
  completed: boolean;
}) {
  return request("/progress", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiRecordSimEvent(kind: "click" | "form_attempt", moduleId: string) {
  return request("/sim-events", {
    method: "POST",
    body: JSON.stringify({ kind, moduleId }),
  });
}

export async function apiInstructorStats() {
  return request<{
    trainees: unknown[];
    departments: unknown[];
    moduleClickRates: unknown[];
    awarenessTrend: unknown[];
    riskHeatmap: unknown[];
    summary: Record<string, number>;
    empty?: boolean;
    note?: string;
  }>("/instructor/stats");
}

export async function apiAdminStats() {
  return request<{
    users: AdminUser[];
    auditLogs: unknown[];
    summary: Record<string, number>;
  }>("/admin/stats");
}

export async function apiAdminListUsers() {
  return request<{ users: AdminUser[] }>("/admin/users");
}

export async function apiAdminCreateUser(payload: {
  username: string;
  password: string;
  displayName: string;
  rank?: string;
  unit?: string;
  department?: string;
  role?: string;
}) {
  return request<{ ok: boolean; user: AdminUser }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiAdminUpdateUser(
  username: string,
  payload: Partial<{
    displayName: string;
    rank: string;
    unit: string;
    department: string;
    role: string;
    isActive: boolean;
    password: string;
  }>
) {
  return request<{ ok: boolean; user: AdminUser }>(
    `/admin/users/${encodeURIComponent(username)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function apiAdminResetProgress(username: string) {
  return request<{ ok: boolean; message: string }>(
    `/admin/users/${encodeURIComponent(username)}/reset-progress`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function apiLeaderboard() {
  return request<{
    entries: {
      username: string;
      displayName: string;
      xp: number;
      level: number;
      rank: string;
      unit: string;
    }[];
  }>("/gamification/leaderboard");
}

export async function apiHealth() {
  return request<{ status: string; mode: string }>("/health");
}

export async function apiVerifyCertificate(certId: string) {
  return request<{
    valid: boolean;
    certificate?: Record<string, unknown>;
    note?: string;
    error?: string;
  }>(`/reports/verify/${encodeURIComponent(certId)}`);
}

export function apiExportCohortCsv(type: "cohort" | "department" | "trend" = "cohort") {
  return apiDownload(
    `/instructor/export/csv?type=${type}`,
    type === "department"
      ? "ba-cyber-department-summary.csv"
      : type === "trend"
        ? "ba-cyber-awareness-trend.csv"
        : "ba-cyber-cohort-completion.csv"
  );
}

export function apiExportCohortPdf() {
  return apiDownload("/instructor/export/pdf", "ba-cyber-cohort-report.pdf");
}

export function apiExportPersonalCsv() {
  return apiDownload("/reports/personal/csv", "ba-cyber-progress.csv");
}

export function apiExportPersonalPdf() {
  return apiDownload("/reports/personal/pdf", "ba-cyber-report.pdf");
}

export async function apiDownloadCertificate() {
  try {
    const token = sessionStorage.getItem("bd_army_api_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-CSRF-Token": ensureCsrfToken(),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/reports/certificate`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false as const, error: (body as { error?: string }).error || res.statusText };
    }
    const certId = res.headers.get("X-Certificate-Id") || "";
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ba-cyber-certificate.pdf";
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true as const, certId };
  } catch {
    return { ok: false as const, error: "API unavailable", offline: true as const };
  }
}
