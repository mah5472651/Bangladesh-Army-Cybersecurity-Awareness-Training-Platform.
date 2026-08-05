import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Trophy, Medal, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { SAMPLE_TRAINEES } from "../data/sampleAnalytics";
import { getLevel } from "../data/gamification";
import { apiLeaderboard } from "../lib/api";
import GlassCard from "../components/GlassCard";
import "./Dashboard.css";

interface BoardEntry {
  username: string;
  displayName: string;
  rank: string;
  unit: string;
  xp: number;
  level: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { totalXp, level } = useProgress();
  const [remote, setRemote] = useState<BoardEntry[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await apiLeaderboard();
      if (res.ok && res.data.entries?.length) {
        setRemote(res.data.entries);
      }
    })();
  }, []);

  const entries = useMemo(() => {
    if (remote) return [...remote].sort((a, b) => b.xp - a.xp);

    const base: BoardEntry[] = SAMPLE_TRAINEES.map((t) => ({
      username: t.username,
      displayName: t.displayName,
      rank: t.rank,
      unit: t.unit,
      xp: t.xp,
      level: t.level,
    }));

    if (user) {
      const idx = base.findIndex((e) => e.username === user.username);
      const self: BoardEntry = {
        username: user.username,
        displayName: user.displayName,
        rank: user.rank,
        unit: user.unit,
        xp: totalXp,
        level: level.level,
      };
      if (idx >= 0) base[idx] = self;
      else base.push(self);
    }

    return base.sort((a, b) => b.xp - a.xp);
  }, [remote, user, totalXp, level]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dash-header">
          <div>
            <div className="section-eyebrow">
              <Trophy size={14} /> Gamification
            </div>
            <h1>Cyber Defender Leaderboard</h1>
            <p>
              Rankings by experience points earned from safe training modules and achievement
              badges. Your level: <strong className="text-gold">{level.title}</strong> ({totalXp} XP)
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            Dashboard
          </Link>
        </header>

        <GlassCard className="chart-card">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Defender</th>
                  <th>Unit</th>
                  <th>Level</th>
                  <th>XP</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const isYou = e.username === user.username;
                  const lvl = getLevel(e.xp);
                  return (
                    <tr
                      key={e.username}
                      style={
                        isYou
                          ? { background: "rgba(212,160,23,0.1)", outline: "1px solid rgba(212,160,23,0.25)" }
                          : undefined
                      }
                    >
                      <td>
                        {i === 0 ? (
                          <Crown size={18} color="#d4a017" />
                        ) : i < 3 ? (
                          <Medal size={18} color="#8a9f5c" />
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td>
                        {e.rank} {e.displayName}{" "}
                        {isYou && <span className="badge badge-gold">You</span>}
                      </td>
                      <td>{e.unit}</td>
                      <td>
                        L{lvl.level} · {lvl.title}
                      </td>
                      <td>
                        <strong className="text-gold">{e.xp}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
