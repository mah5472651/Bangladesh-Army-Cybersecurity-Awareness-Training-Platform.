import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Signal } from "lucide-react";
import type { TrainingModule } from "../data/modules";
import { useProgress } from "../context/ProgressContext";
import GlassCard from "./GlassCard";
import "./ModuleLayout.css";

interface ModuleLayoutProps {
  module: TrainingModule;
  children: React.ReactNode;
}

export default function ModuleLayout({ module, children }: ModuleLayoutProps) {
  const { getModuleProgress } = useProgress();
  const prog = getModuleProgress(module.id);

  return (
    <div className="module-page">
      <div className="container">
        <Link to="/modules" className="module-back">
          <ArrowLeft size={16} /> All Modules
        </Link>

        <header className="module-header glass">
          <div className="module-header-top">
            <span className="badge badge-gold">Module {module.number}</span>
            {prog?.completed ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Completed · {prog.score}%
              </span>
            ) : (
              <span className="badge badge-olive">In Training</span>
            )}
          </div>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
          <div className="module-meta">
            <span>
              <Clock size={14} /> {module.duration}
            </span>
            <span>
              <Signal size={14} /> {module.difficulty}
            </span>
          </div>
        </header>

        <div className="module-objectives glass">
          <h3>Learning Objectives</h3>
          <ul>
            {module.objectives.map((obj) => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
        </div>

        <GlassCard className="module-body">{children}</GlassCard>
      </div>
    </div>
  );
}
