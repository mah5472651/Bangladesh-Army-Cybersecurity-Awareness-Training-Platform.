import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  Target,
  AlertTriangle,
  TrendingUp,
  Shield,
  MousePointerClick,
  FileInput,
  Loader2,
  Inbox,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import type { TraineeStat, DepartmentProgress } from "../data/sampleAnalytics";
import { apiInstructorStats } from "../lib/api";
import GlassCard from "../components/GlassCard";
import "./Dashboard.css";

function riskColor(level: string | number): string {
  if (typeof level === "number") {
    if (level >= 40) return "#e74c3c";
    if (level >= 25) return "#f39c12";
    return "#27ae60";
  }
  if (level === "High") return "#e74c3c";
  if (level === "Medium") return "#f39c12";
  return "#27ae60";
}

type HeatRow = {
  unit: string;
  email: number;
  sms: number;
  qr: number;
  social: number;
  overall: number;
};

type ClickRate = { module: string; clickRate: number; submissions?: number };
type Trend = { month: string; score: number };

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<TraineeStat[]>([]);
  const [departments, setDepartments] = useState<DepartmentProgress[]>([]);
  const [clickRates, setClickRates] = useState<ClickRate[]>([]);
  const [trend, setTrend] = useState<Trend[]>([]);
  const [heatmap, setHeatmap] = useState<HeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await apiInstructorStats();
      if (res.ok) {
        setTrainees((res.data.trainees as TraineeStat[]) || []);
        setDepartments((res.data.departments as DepartmentProgress[]) || []);
        setClickRates((res.data.moduleClickRates as ClickRate[]) || []);
        setTrend((res.data.awarenessTrend as Trend[]) || []);
        // Normalize heatmap: API may use department or unit
        const raw = (res.data.riskHeatmap || []) as Array<Record<string, unknown>>;
        setHeatmap(
          raw.map((r) => ({
            unit: String(r.unit || r.department || "—"),
            email: Number(r.email ?? r.risk ?? 0),
            sms: Number(r.sms ?? 0),
            qr: Number(r.qr ?? 0),
            social: Number(r.social ?? 0),
            overall: Number(r.overall ?? r.risk ?? 0),
          }))
        );
        setOffline(false);
      } else {
        setOffline(Boolean(res.offline));
        setError(res.error || "Failed to load instructor stats");
        // No silent sample data — show empty state
        setTrainees([]);
        setDepartments([]);
        setClickRates([]);
        setTrend([]);
        setHeatmap([]);
      }
      setLoading(false);
    })();
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "instructor" && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const totalTrainees = trainees.length;
  const avgCompletion =
    totalTrainees === 0
      ? 0
      : Math.round(
          trainees.reduce((s, t) => s + (t.completedModules / t.totalModules) * 100, 0) /
            totalTrainees
        );
  const avgAwareness =
    totalTrainees === 0
      ? 0
      : Math.round(trainees.reduce((s, t) => s + t.awarenessScore, 0) / totalTrainees);
  const totalFormAttempts = trainees.reduce((s, t) => s + t.formAttempts, 0);
  const totalClicks = trainees.reduce((s, t) => s + t.simClicks, 0);
  const empty = !loading && totalTrainees === 0;

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dash-header">
          <div>
            <div className="section-eyebrow">
              <Shield size={14} /> Instructor Command View
            </div>
            <h1>Instructor Dashboard</h1>
            <p>
              Live training participation, module completion, quiz scores, and simulation metrics.
              <strong> No passwords or sensitive inputs are stored or displayed.</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link to="/reports" className="btn btn-secondary btn-sm">
              Reports
            </Link>
            {user.role === "admin" && (
              <Link to="/admin" className="btn btn-primary btn-sm">
                Admin Console
              </Link>
            )}
          </div>
        </header>

        {loading && (
          <GlassCard className="chart-card" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <Loader2 className="spin" size={28} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 8, color: "var(--olive-300)" }}>Loading live cohort data…</p>
          </GlassCard>
        )}

        {error && (
          <div className="alert alert-warning" role="alert" style={{ marginBottom: "1rem" }}>
            <AlertTriangle size={16} />
            {offline
              ? "API offline — cannot load live instructor stats. Start the API (npm run dev:api) or use Docker."
              : error}
          </div>
        )}

        {empty && !error && (
          <GlassCard className="chart-card" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <Inbox size={36} color="var(--gold-400)" />
            <h3 style={{ marginTop: 12 }}>No trainees yet</h3>
            <p style={{ color: "var(--olive-300)", maxWidth: 480, margin: "8px auto" }}>
              The cohort is empty. Seed demo users (<code>npm run db:seed</code> in server) or ask an
              admin to create training accounts. Fake sample numbers are never shown.
            </p>
            {user.role === "admin" && (
              <Link to="/admin" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                Open Admin Console
              </Link>
            )}
          </GlassCard>
        )}

        <div className="dash-kpis" aria-live="polite">
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Trainees</span>
              <strong className="kpi-value">{totalTrainees}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="kpi-label">Avg Completion</span>
              <strong className="kpi-value">{empty ? "—" : `${avgCompletion}%`}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Target size={20} />
            </div>
            <div>
              <span className="kpi-label">Awareness Score</span>
              <strong className="kpi-value">{empty ? "—" : avgAwareness}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <MousePointerClick size={20} />
            </div>
            <div>
              <span className="kpi-label">Sim Clicks (count)</span>
              <strong className="kpi-value">{empty ? "—" : totalClicks}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <FileInput size={20} />
            </div>
            <div>
              <span className="kpi-label">Form Attempts (count)</span>
              <strong className="kpi-value">{empty ? "—" : totalFormAttempts}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="kpi-label">Trend</span>
              <strong className="kpi-value">
                {trend.length ? `${trend[trend.length - 1]?.score}%` : "—"}
              </strong>
            </div>
          </GlassCard>
        </div>

        {!empty && (
          <>
            <div className="dash-charts">
              <GlassCard className="chart-card">
                <h3>Simulated Phishing Click / Submission Rates</h3>
                <p style={{ color: "var(--olive-400)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  Counts only — educational simulations, not real attacks
                </p>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={clickRates}>
                      <XAxis
                        dataKey="module"
                        tick={{ fill: "#a8b87a", fontSize: 10 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#8a9f5c" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "#0f1a0c",
                          border: "1px solid rgba(212,160,23,0.3)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="clickRate" name="Click %" fill="#d4a017" radius={[6, 6, 0, 0]} />
                      <Bar
                        dataKey="submissions"
                        name="Submissions"
                        fill="#6b8a4a"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="chart-card">
                <h3>Awareness Trend</h3>
                <div className="chart-wrap">
                  {trend.length === 0 ? (
                    <p style={{ color: "var(--olive-400)" }}>No trend data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={trend}>
                        <CartesianGrid stroke="rgba(138,159,92,0.15)" />
                        <XAxis dataKey="month" stroke="#8a9f5c" />
                        <YAxis domain={[40, 100]} stroke="#8a9f5c" />
                        <Tooltip
                          contentStyle={{
                            background: "#0f1a0c",
                            border: "1px solid rgba(212,160,23,0.3)",
                            borderRadius: 8,
                          }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#d4a017" strokeWidth={3} dot />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </div>

            <GlassCard className="chart-card" style={{ marginBottom: "1.5rem" }}>
              <h3>Department Progress</h3>
              <div className="dash-module-list" style={{ marginTop: "1rem" }}>
                {departments.map((d) => (
                  <div
                    key={d.department}
                    className="dash-mod"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                      gap: "0.75rem",
                      alignItems: "center",
                      padding: "0.85rem 1rem",
                    }}
                  >
                    <strong>{d.department}</strong>
                    <span>{d.trainees} trainees</span>
                    <span>
                      Completion <strong className="text-gold">{d.completionRate}%</strong>
                    </span>
                    <span>
                      Risk{" "}
                      <span
                        className="badge"
                        style={{
                          color: riskColor(d.riskLevel),
                          borderColor: riskColor(d.riskLevel),
                        }}
                      >
                        {d.riskLevel}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {heatmap.length > 0 && (
              <GlassCard className="chart-card" style={{ marginBottom: "1.5rem" }}>
                <h3>
                  <AlertTriangle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Risk Heatmap (relative risk index — lower is better)
                </h3>
                <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>Email</th>
                        <th>SMS</th>
                        <th>QR</th>
                        <th>Social</th>
                        <th>Overall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmap.map((row) => (
                        <tr key={row.unit}>
                          <td>{row.unit}</td>
                          {(["email", "sms", "qr", "social", "overall"] as const).map((k) => (
                            <td key={k}>
                              <span
                                style={{
                                  display: "inline-block",
                                  minWidth: 36,
                                  textAlign: "center",
                                  padding: "0.2rem 0.45rem",
                                  borderRadius: 6,
                                  background: `${riskColor(row[k])}22`,
                                  color: riskColor(row[k]),
                                  fontWeight: 700,
                                }}
                              >
                                {row[k]}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            <GlassCard className="chart-card">
              <h3>Trainee Participation & Quiz Scores ({trainees.length})</h3>
              <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trainee</th>
                      <th>Unit</th>
                      <th>Dept</th>
                      <th>Modules</th>
                      <th>Avg Score</th>
                      <th>Awareness</th>
                      <th>Sim Clicks</th>
                      <th>Form Attempts</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainees.map((t) => (
                      <tr key={t.username}>
                        <td>
                          {t.rank} {t.displayName}
                        </td>
                        <td>{t.unit}</td>
                        <td>{t.department}</td>
                        <td>
                          {t.completedModules}/{t.totalModules}
                        </td>
                        <td>{t.averageScore}%</td>
                        <td>{t.awarenessScore}</td>
                        <td>{t.simClicks}</td>
                        <td>{t.formAttempts}</td>
                        <td>
                          {t.completedModules === t.totalModules ? (
                            <span className="badge badge-success">Complete</span>
                          ) : t.completedModules === 0 ? (
                            <span className="badge badge-danger">Not started</span>
                          ) : (
                            <span className="badge badge-olive">In progress</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
