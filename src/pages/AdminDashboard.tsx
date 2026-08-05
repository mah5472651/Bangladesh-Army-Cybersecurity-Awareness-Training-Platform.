import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Shield,
  Users,
  Server,
  Activity,
  FileWarning,
  Database,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DEMO_ACCOUNTS } from "../data/demoAccounts";
import { SAMPLE_TRAINEES } from "../data/sampleAnalytics";
import { apiAdminStats, apiHealth } from "../lib/api";
import GlassCard from "../components/GlassCard";
import "./Dashboard.css";

interface AuditLog {
  id: string;
  time: string;
  actor: string;
  action: string;
  detail: string;
}

const DEFAULT_LOGS: AuditLog[] = [
  {
    id: "1",
    time: "2026-04-06T09:12:00Z",
    actor: "instructor001",
    action: "VIEW_STATS",
    detail: "Opened instructor dashboard",
  },
  {
    id: "2",
    time: "2026-04-06T08:55:00Z",
    actor: "trainee001",
    action: "MODULE_COMPLETE",
    detail: "Completed email-phishing (score 92) — no credentials logged",
  },
  {
    id: "3",
    time: "2026-04-06T08:40:00Z",
    actor: "trainee002",
    action: "SIM_FORM_ATTEMPT",
    detail: "Fake-login simulation form attempt counted (password discarded)",
  },
  {
    id: "4",
    time: "2026-04-05T16:20:00Z",
    actor: "system",
    action: "AUTH_REJECT",
    detail: "Rejected external email provider login attempt",
  },
  {
    id: "5",
    time: "2026-04-05T14:02:00Z",
    actor: "admin001",
    action: "EXPORT_CSV",
    detail: "Exported completion statistics (no secrets)",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>(DEFAULT_LOGS);
  const [apiMode, setApiMode] = useState("offline-local");
  const [summary, setSummary] = useState({
    users: DEMO_ACCOUNTS.length + 1,
    activeSessions: 3,
    modules: 8,
    auditEvents: DEFAULT_LOGS.length,
  });

  useEffect(() => {
    void (async () => {
      const health = await apiHealth();
      if (health.ok) setApiMode(health.data.mode || "online");
      const res = await apiAdminStats();
      if (res.ok) {
        if (res.data.auditLogs?.length) setLogs(res.data.auditLogs as AuditLog[]);
        if (res.data.summary) {
          setSummary((s) => ({ ...s, ...res.data.summary }));
        }
      }
    })();
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "instructor") {
    // Instructors can view a limited admin overview; pure trainees blocked
    return <Navigate to="/dashboard" replace />;
  }
  // Only admin001 full admin; instructors redirected if not admin
  if (user.role !== "admin") {
    return <Navigate to="/instructor" replace />;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dash-header">
          <div>
            <div className="section-eyebrow">
              <Shield size={14} /> Platform Administration
            </div>
            <h1>Admin Dashboard</h1>
            <p>
              System health, training accounts, and audit logs for the authorized cybersecurity
              awareness training platform. Credentials are never stored from simulations.
            </p>
          </div>
          <Link to="/instructor" className="btn btn-secondary btn-sm">
            Instructor View
          </Link>
        </header>

        <div className="dash-kpis">
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Training Accounts</span>
              <strong className="kpi-value">{summary.users}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Activity size={20} />
            </div>
            <div>
              <span className="kpi-label">Active Sessions</span>
              <strong className="kpi-value">{summary.activeSessions}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Database size={20} />
            </div>
            <div>
              <span className="kpi-label">Modules</span>
              <strong className="kpi-value">{summary.modules}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Server size={20} />
            </div>
            <div>
              <span className="kpi-label">API Mode</span>
              <strong className="kpi-value" style={{ fontSize: "1.1rem" }}>
                {apiMode}
              </strong>
            </div>
          </GlassCard>
        </div>

        <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
          <GlassCard className="chart-card">
            <h3>
              <Lock size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Security Controls
            </h3>
            <ul style={{ marginTop: "1rem", color: "var(--olive-300)", lineHeight: 1.9 }}>
              <li>Training-only authentication (no external IdP)</li>
              <li>Simulation passwords discarded client + server</li>
              <li>Helmet CSP, rate limiting, XSS input sanitization</li>
              <li>SQL parameterized queries / safe file store</li>
              <li>Audit logging without secret fields</li>
              <li>HTTPS termination via Nginx in production</li>
            </ul>
          </GlassCard>

          <GlassCard className="chart-card">
            <h3>Demo / Training Accounts</h3>
            <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((a) => (
                    <tr key={a.username}>
                      <td>
                        <code>{a.username}</code>
                      </td>
                      <td>{a.role}</td>
                      <td>{a.unit}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <code>admin001</code>
                    </td>
                    <td>admin</td>
                    <td>Cyber Defence Wing</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--olive-400)" }}>
              Sample cohort size (analytics): {SAMPLE_TRAINEES.length} trainees
            </p>
          </GlassCard>
        </div>

        <GlassCard className="chart-card">
          <h3>
            <FileWarning size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Audit Log
          </h3>
          <p style={{ color: "var(--olive-400)", fontSize: "0.85rem" }}>
            Actions only — never passwords, OTPs, or free-text secrets
          </p>
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time (UTC)</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.time).toLocaleString()}</td>
                    <td>
                      <code>{l.actor}</code>
                    </td>
                    <td>
                      <span className="badge badge-olive">{l.action}</span>
                    </td>
                    <td>{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
