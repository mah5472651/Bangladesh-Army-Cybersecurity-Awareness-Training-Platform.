import { Link } from "react-router-dom";
import {
  Mail,
  Lock,
  QrCode,
  MessageSquare,
  Phone,
  Usb,
  KeyRound,
  Shield,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { TRAINING_MODULES } from "../data/modules";
import { useProgress } from "../context/ProgressContext";
import GlassCard from "../components/GlassCard";
import "./Modules.css";

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

export default function Modules() {
  const { progress, overallPercent, completedCount } = useProgress();

  return (
    <div className="modules-page">
      <div className="container">
        <header className="modules-header">
          <div className="section-eyebrow">
            <Shield size={14} /> Training Curriculum
          </div>
          <h1>All Training Modules</h1>
          <p>
            Complete all {TRAINING_MODULES.length} modules to achieve full cybersecurity awareness
            certification readiness. Progress:{" "}
            <strong className="text-gold">
              {completedCount}/{TRAINING_MODULES.length}
            </strong>{" "}
            ({overallPercent}%)
          </p>
          <div className="progress-track" style={{ maxWidth: 420, marginTop: "1rem" }}>
            <div className="progress-fill" style={{ width: `${overallPercent}%` }} />
          </div>
        </header>

        <div className="modules-full-grid">
          {TRAINING_MODULES.map((m) => {
            const Icon = ICON_MAP[m.icon] ?? Shield;
            const p = progress.find((x) => x.moduleId === m.id);
            const done = p?.completed;

            return (
              <GlassCard key={m.id} className={`mod-full ${done ? "completed" : ""}`}>
                <div className="mod-full-left">
                  <div
                    className="mod-full-icon"
                    style={{ background: `${m.color}18`, color: m.color }}
                  >
                    <Icon size={28} />
                  </div>
                </div>
                <div className="mod-full-body">
                  <div className="mod-full-badges">
                    <span className="badge badge-gold">Module {m.number}</span>
                    {done ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={11} /> {p?.score}% Complete
                      </span>
                    ) : (
                      <span className="badge badge-olive">{m.difficulty}</span>
                    )}
                  </div>
                  <h2>{m.title}</h2>
                  <p>{m.description}</p>
                  <div className="mod-full-meta">
                    <span>
                      <Clock size={13} /> {m.duration}
                    </span>
                    <span>{m.objectives.length} objectives</span>
                  </div>
                </div>
                <div className="mod-full-action">
                  <Link to={m.path} className="btn btn-primary">
                    {done ? "Review" : "Start"} <ChevronRight size={16} />
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
