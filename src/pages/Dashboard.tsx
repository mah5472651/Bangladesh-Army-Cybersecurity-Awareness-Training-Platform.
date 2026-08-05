import { Link } from "react-router-dom";
import {
  Shield,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  Mail,
  Lock,
  QrCode,
  MessageSquare,
  Phone,
  Usb,
  KeyRound,
  Users,
  Trophy,
  Star,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { TRAINING_MODULES } from "../data/modules";
import { BADGES } from "../data/gamification";
import GlassCard from "../components/GlassCard";
import "./Dashboard.css";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Mail,
  Lock,
  QrCode,
  MessageSquare,
  Phone,
  Usb,
  KeyRound,
  Users,
};

const CHART_COLORS = ["#d4a017", "#6b8a4a", "#27ae60", "#3498db", "#9b59b6", "#e67e22", "#e74c3c"];

export default function Dashboard() {
  const { user } = useAuth();
  const {
    progress,
    overallPercent,
    completedCount,
    averageScore,
    totalXp,
    badges,
    level,
    nextLevel,
    levelProgress,
    awarenessScore,
  } = useProgress();

  const scoreData = TRAINING_MODULES.map((m, i) => {
    const p = progress.find((x) => x.moduleId === m.id);
    return {
      name: `M${m.number}`,
      fullName: m.shortTitle,
      score: p?.completed ? p.score : 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const pieData = [
    { name: "Completed", value: completedCount, color: "#27ae60" },
    {
      name: "Remaining",
      value: TRAINING_MODULES.length - completedCount,
      color: "rgba(138, 159, 92, 0.35)",
    },
  ];

  const radarData = TRAINING_MODULES.map((m) => {
    const p = progress.find((x) => x.moduleId === m.id);
    return {
      subject: m.shortTitle.split(" ")[0],
      score: p?.completed ? p.score : 10,
      fullMark: 100,
    };
  });

  const nextModule = TRAINING_MODULES.find((m) => {
    const p = progress.find((x) => x.moduleId === m.id);
    return !p?.completed;
  });

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dash-header">
          <div>
            <div className="section-eyebrow">
              <Shield size={14} /> Command Dashboard
            </div>
            <h1>
              Welcome, {user?.rank} {user?.displayName}
            </h1>
            <p>
              {user?.unit} · Training account: <code>{user?.username}</code> · Role:{" "}
              <span className="text-gold">{user?.role}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(user?.role === "instructor" || user?.role === "admin") && (
              <Link to="/instructor" className="btn btn-secondary btn-sm">
                Instructor View
              </Link>
            )}
            {nextModule && (
              <Link to={nextModule.path} className="btn btn-primary">
                Continue: {nextModule.shortTitle} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </header>

        <div className="dash-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="kpi-label">Overall Progress</span>
              <strong className="kpi-value">{overallPercent}%</strong>
            </div>
            <div className="progress-track kpi-bar">
              <div className="progress-fill" style={{ width: `${overallPercent}%` }} />
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="kpi-label">Modules Complete</span>
              <strong className="kpi-value">
                {completedCount}/{TRAINING_MODULES.length}
              </strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Award size={20} />
            </div>
            <div>
              <span className="kpi-label">Average Score</span>
              <strong className="kpi-value">{averageScore || "—"}%</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Shield size={20} />
            </div>
            <div>
              <span className="kpi-label">Awareness Score</span>
              <strong className="kpi-value">{awarenessScore}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Zap size={20} />
            </div>
            <div>
              <span className="kpi-label">Experience (XP)</span>
              <strong className="kpi-value">{totalXp}</strong>
            </div>
          </GlassCard>
          <GlassCard className="kpi-card">
            <div className="kpi-icon">
              <Trophy size={20} />
            </div>
            <div>
              <span className="kpi-label">Cyber Level</span>
              <strong className="kpi-value" style={{ fontSize: "1rem" }}>
                L{level.level}
              </strong>
              <span style={{ fontSize: "0.75rem", color: "var(--olive-300)" }}>{level.title}</span>
            </div>
            <div className="progress-track kpi-bar">
              <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
            </div>
            {nextLevel && (
              <span style={{ fontSize: "0.75rem", color: "var(--olive-400)" }}>
                Next: {nextLevel.title} ({nextLevel.minXp} XP)
              </span>
            )}
          </GlassCard>
        </div>

        <GlassCard className="chart-card" style={{ marginBottom: "1.5rem" }}>
          <h3>
            <Star size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Achievement Badges
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            {BADGES.map((b) => {
              const earned = badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  style={{
                    padding: "0.85rem",
                    borderRadius: 10,
                    border: `1px solid ${earned ? "rgba(212,160,23,0.45)" : "rgba(138,159,92,0.2)"}`,
                    background: earned ? "rgba(212,160,23,0.1)" : "rgba(0,0,0,0.2)",
                    opacity: earned ? 1 : 0.55,
                  }}
                >
                  <strong style={{ color: earned ? "var(--gold-300)" : "var(--olive-300)" }}>
                    {b.name}
                  </strong>
                  <p style={{ fontSize: "0.8rem", color: "var(--olive-400)", marginTop: 4 }}>
                    {b.description}
                  </p>
                  {earned ? (
                    <span className="badge badge-success" style={{ marginTop: 6 }}>
                      Earned · +{b.xpReward} XP
                    </span>
                  ) : (
                    <span className="badge badge-olive" style={{ marginTop: 6 }}>
                      Locked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link to="/leaderboard" className="btn btn-secondary btn-sm">
              Leaderboard
            </Link>
            <Link to="/certificate" className="btn btn-ghost btn-sm">
              Certificate
            </Link>
            <Link to="/reports" className="btn btn-ghost btn-sm">
              Reports
            </Link>
          </div>
        </GlassCard>

        <div className="dash-charts">
          <GlassCard className="chart-card">
            <h3>Module Assessment Scores</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#8a9f5c" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#8a9f5c" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1a0c",
                      border: "1px solid rgba(212,160,23,0.3)",
                      borderRadius: 8,
                      color: "#e8ebe3",
                    }}
                    formatter={(value) => [`${value}%`, "Score"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? ""
                    }
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {scoreData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="chart-card">
            <h3>Completion Status</h3>
            <div className="chart-wrap pie-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f1a0c",
                      border: "1px solid rgba(212,160,23,0.3)",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center">
                <strong>{overallPercent}%</strong>
                <span>Done</span>
              </div>
            </div>
            <div className="pie-legend">
              <span>
                <i style={{ background: "#27ae60" }} /> Completed
              </span>
              <span>
                <i style={{ background: "rgba(138,159,92,0.35)" }} /> Remaining
              </span>
            </div>
          </GlassCard>

          <GlassCard className="chart-card chart-wide">
            <h3>Skill Coverage Radar</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(138,159,92,0.3)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#a8b87a", fontSize: 11 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#d4a017"
                    fill="rgba(212,160,23,0.25)"
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1a0c",
                      border: "1px solid rgba(212,160,23,0.3)",
                      borderRadius: 8,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <section className="dash-modules">
          <div className="dash-section-head">
            <h2>Module Status</h2>
            <Link to="/modules" className="btn btn-secondary btn-sm">
              View All Modules
            </Link>
          </div>
          <div className="dash-module-list">
            {TRAINING_MODULES.map((m) => {
              const p = progress.find((x) => x.moduleId === m.id);
              const Icon = ICON_MAP[m.icon] ?? Shield;
              const done = p?.completed;
              return (
                <GlassCard key={m.id} className={`dash-mod ${done ? "done" : ""}`}>
                  <div className="dash-mod-icon" style={{ color: m.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="dash-mod-info">
                    <h4>
                      Module {m.number}: {m.shortTitle}
                    </h4>
                    <p>
                      {done
                        ? `Completed · Score ${p?.score}% · ${p?.attempts} attempt(s)`
                        : `${m.duration} · ${m.difficulty}`}
                    </p>
                  </div>
                  <div className="dash-mod-status">
                    {done ? (
                      <CheckCircle2 size={20} color="#27ae60" />
                    ) : (
                      <Circle size={20} color="#8a9f5c" />
                    )}
                  </div>
                  <Link to={m.path} className="btn btn-ghost btn-sm">
                    {done ? "Review" : "Start"}
                  </Link>
                </GlassCard>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
