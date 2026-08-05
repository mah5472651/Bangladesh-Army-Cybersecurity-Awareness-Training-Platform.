import { Link } from "react-router-dom";
import {
  Shield,
  Target,
  Eye,
  Zap,
  Mail,
  Lock,
  QrCode,
  MessageSquare,
  Phone,
  Usb,
  KeyRound,
  Users,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  Award,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  TRAINING_MODULES,
  PLATFORM_STATS,
  AWARENESS_REASONS,
  TRAINING_OBJECTIVES,
} from "../data/modules";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import GlassCard from "../components/GlassCard";
import ArmyLogo from "../components/ArmyLogo";
import "./Landing.css";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Mail,
  Lock,
  QrCode,
  MessageSquare,
  Phone,
  Usb,
  KeyRound,
  Users,
  Shield,
  Eye,
  Target,
  Zap,
};

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { overallPercent, completedCount } = useProgress();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content animate-in">
            <div className="hero-emblem-row">
              <ArmyLogo size={72} className="hero-army-logo" />
              <div className="section-eyebrow">
                <Shield size={14} /> Official Training Platform
              </div>
            </div>
            <h1>
              Bangladesh Army
              <span className="hero-highlight"> Cybersecurity Awareness</span>
              <br />
              Training Platform
            </h1>
            <p className="hero-lead">
              Enterprise-grade awareness training for authorized personnel. Master phishing,
              social engineering, fake logins, QR scams, and more through safe, realistic
              simulations — without ever collecting real credentials.
            </p>
            <div className="hero-cta">
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="btn btn-primary btn-lg"
              >
                {isAuthenticated ? "Open Dashboard" : "Begin Training"}
                <ArrowRight size={18} />
              </Link>
              <a href="#modules" className="btn btn-secondary btn-lg">
                View Modules
              </a>
            </div>
            <div className="hero-trust">
              <span>
                <CheckCircle2 size={14} /> Demo accounts only
              </span>
              <span>
                <CheckCircle2 size={14} /> Zero credential storage
              </span>
              <span>
                <CheckCircle2 size={14} /> Internal training use
              </span>
            </div>
          </div>

          <div className="hero-visual animate-in">
            <GlassCard strong className="hero-card">
              <div className="hero-card-header">
                <div className="status-dot" />
                <span>THREAT SIMULATION ACTIVE</span>
              </div>
              <div className="hero-radar">
                <div className="radar-ring r1" />
                <div className="radar-ring r2" />
                <div className="radar-ring r3" />
                <div className="radar-core">
                  <Shield size={32} />
                </div>
                <div className="radar-blip b1" />
                <div className="radar-blip b2" />
                <div className="radar-blip b3" />
              </div>
              <div className="hero-stats-mini">
                <div>
                  <strong>{PLATFORM_STATS.threatSims}</strong>
                  <span>Modules</span>
                </div>
                <div>
                  <strong>{PLATFORM_STATS.phishingCaught}%</strong>
                  <span>Detection Goal</span>
                </div>
                <div>
                  <strong>{PLATFORM_STATS.activeUnits}</strong>
                  <span>Units Ready</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="awareness-banner">
        <div className="container banner-inner">
          <AlertTriangle size={22} />
          <p>
            <strong>CYBERSECURITY AWARENESS:</strong> Adversaries target military personnel
            through email, SMS, phone, QR codes, and removable media. Stay vigilant — verify
            before you click, scan, plug in, or share.
          </p>
        </div>
      </section>

      {/* Objectives */}
      <section className="section" id="objectives">
        <div className="container">
          <div className="section-head text-center">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>
              <Target size={14} /> Mission Brief
            </div>
            <h2 className="section-title">Training Objectives</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Every module builds practical skills to defend the force against social
              engineering and cyber deception.
            </p>
          </div>
          <div className="objectives-list">
            {TRAINING_OBJECTIVES.map((obj, i) => (
              <GlassCard key={obj} className="objective-item">
                <span className="obj-num">{String(i + 1).padStart(2, "0")}</span>
                <p>{obj}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="section section-alt" id="why">
        <div className="container">
          <div className="section-head text-center">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>
              <Eye size={14} /> Strategic Imperative
            </div>
            <h2 className="section-title">Why Cyber Awareness Matters</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Modern conflict extends into cyberspace. Human judgment remains the decisive
              factor.
            </p>
          </div>
          <div className="grid-2 reasons-grid">
            {AWARENESS_REASONS.map((r) => {
              const Icon = ICON_MAP[r.icon] ?? Shield;
              return (
                <GlassCard key={r.title} className="reason-card">
                  <div className="reason-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="section" id="modules">
        <div className="container">
          <div className="section-head text-center">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>
              <BookOpen size={14} /> Curriculum
            </div>
            <h2 className="section-title">Training Modules</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Eight interactive modules covering the most common attack vectors against
              military personnel.
            </p>
          </div>
          <div className="modules-grid">
            {TRAINING_MODULES.map((m) => {
              const Icon = ICON_MAP[m.icon] ?? Shield;
              return (
                <GlassCard key={m.id} className="module-card">
                  <div className="module-card-top">
                    <div
                      className="module-icon"
                      style={{ background: `${m.color}22`, color: m.color }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="badge badge-olive">M{m.number}</span>
                  </div>
                  <h3>{m.shortTitle}</h3>
                  <p>{m.description}</p>
                  <div className="module-card-meta">
                    <span>{m.duration}</span>
                    <span>{m.difficulty}</span>
                  </div>
                  <Link
                    to={isAuthenticated ? m.path : "/login"}
                    className="module-card-link"
                  >
                    Start Module <ChevronRight size={16} />
                  </Link>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="section section-alt" id="stats">
        <div className="container">
          <div className="section-head text-center">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>
              <TrendingUp size={14} /> Force Readiness
            </div>
            <h2 className="section-title">Platform Statistics</h2>
          </div>
          <div className="grid-4 stats-grid">
            <GlassCard className="stat-card">
              <Users size={24} className="text-gold" />
              <strong>{PLATFORM_STATS.personnelTrained.toLocaleString()}</strong>
              <span>Personnel Trained</span>
            </GlassCard>
            <GlassCard className="stat-card">
              <BookOpen size={24} className="text-gold" />
              <strong>{PLATFORM_STATS.modulesCompleted.toLocaleString()}</strong>
              <span>Modules Completed</span>
            </GlassCard>
            <GlassCard className="stat-card">
              <Shield size={24} className="text-gold" />
              <strong>{PLATFORM_STATS.phishingCaught}%</strong>
              <span>Phishing Detection Rate</span>
            </GlassCard>
            <GlassCard className="stat-card">
              <Award size={24} className="text-gold" />
              <strong>{PLATFORM_STATS.avgScore}%</strong>
              <span>Average Assessment Score</span>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Progress overview */}
      <section className="section" id="progress">
        <div className="container">
          <div className="progress-overview glass">
            <div className="progress-overview-text">
              <div className="section-eyebrow">
                <TrendingUp size={14} /> Your Progress
              </div>
              <h2>
                {isAuthenticated
                  ? `Training Progress: ${overallPercent}%`
                  : "Track Your Training Progress"}
              </h2>
              <p>
                {isAuthenticated
                  ? `You have completed ${completedCount} of ${TRAINING_MODULES.length} modules. Continue to strengthen your cyber defence posture.`
                  : "Sign in with a training account to track module completion, scores, and readiness across all eight threat simulations."}
              </p>
              {isAuthenticated && (
                <div className="progress-track mt-2" style={{ maxWidth: 360 }}>
                  <div className="progress-fill" style={{ width: `${overallPercent}%` }} />
                </div>
              )}
            </div>
            <div className="progress-overview-cta">
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="btn btn-primary btn-lg"
              >
                {isAuthenticated ? "Go to Dashboard" : "Login to Track Progress"}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <GlassCard strong className="cta-card">
            <div className="cta-glow" />
            <ArmyLogo size={64} />
            <h2>Ready to Strengthen the Human Firewall?</h2>
            <p>
              Access the Bangladesh Army Cybersecurity Awareness Training Platform with your
              assigned training account. Real credentials are never accepted or stored.
            </p>
            <Link
              to={isAuthenticated ? "/modules" : "/login"}
              className="btn btn-primary btn-lg"
            >
              {isAuthenticated ? "Continue Modules" : "Enter Training Portal"}
              <ArrowRight size={18} />
            </Link>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
