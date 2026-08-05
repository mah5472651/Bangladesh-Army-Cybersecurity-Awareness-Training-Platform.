import { Link, Navigate } from "react-router-dom";
import { Award, Download, Printer, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { TRAINING_MODULES } from "../data/modules";
import ArmyLogo from "../components/ArmyLogo";
import GlassCard from "../components/GlassCard";
import { printCertificate } from "../lib/exportUtils";
import "./Certificate.css";

export default function Certificate() {
  const { user } = useAuth();
  const { completedCount, averageScore, totalXp, level, overallPercent } = useProgress();

  if (!user) return <Navigate to="/login" replace />;

  const eligible = completedCount >= TRAINING_MODULES.length;
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const certId = `BA-CAT-${user.username.toUpperCase()}-${completedCount}${averageScore}`;

  return (
    <div className="certificate-page">
      <div className="container">
        <header className="dash-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <div className="section-eyebrow">
              <Award size={14} /> Training Certificate
            </div>
            <h1>Cyber Defender Certificate</h1>
            <p>
              Authorized Bangladesh Army cybersecurity awareness training recognition. Complete all{" "}
              {TRAINING_MODULES.length} modules to unlock the full certificate.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={printCertificate} disabled={!eligible}>
              <Printer size={15} /> Print / PDF
            </button>
            <Link to="/dashboard" className="btn btn-ghost btn-sm">
              Dashboard
            </Link>
          </div>
        </header>

        {!eligible && (
          <GlassCard className="chart-card" style={{ marginBottom: "1.25rem" }}>
            <p>
              Progress: <strong className="text-gold">{completedCount}/{TRAINING_MODULES.length}</strong>{" "}
              modules ({overallPercent}%). Finish remaining modules to generate your official
              training certificate.
            </p>
            <Link to="/modules" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
              Continue Training
            </Link>
          </GlassCard>
        )}

        <div className={`certificate-sheet ${eligible ? "" : "certificate-locked"}`} id="certificate-print">
          <div className="cert-border">
            <div className="cert-header">
              <ArmyLogo size={72} />
              <div>
                <p className="cert-org">Bangladesh Army</p>
                <p className="cert-platform">Cybersecurity Awareness Training Platform</p>
              </div>
              <Shield size={40} color="#d4a017" />
            </div>

            <p className="cert-label">Certificate of Completion</p>
            <h2 className="cert-title">Cyber Defender Awareness</h2>

            <p className="cert-presented">This certifies that</p>
            <p className="cert-name">
              {user.rank} {user.displayName}
            </p>
            <p className="cert-unit">
              {user.unit} · Training ID: <code>{user.username}</code>
            </p>

            <p className="cert-body">
              has successfully completed the authorized internal cybersecurity awareness curriculum
              covering phishing, social engineering, fake login recognition, QR/SMS/voice threats,
              USB security, and password hygiene — through safe educational simulations that never
              collect real credentials.
            </p>

            <div className="cert-stats">
              <div>
                <strong>{completedCount}/{TRAINING_MODULES.length}</strong>
                <span>Modules</span>
              </div>
              <div>
                <strong>{averageScore || 0}%</strong>
                <span>Avg Score</span>
              </div>
              <div>
                <strong>{totalXp}</strong>
                <span>XP</span>
              </div>
              <div>
                <strong>{level.title}</strong>
                <span>Level {level.level}</span>
              </div>
            </div>

            <div className="cert-footer">
              <div>
                <span className="cert-date">{dateStr}</span>
                <span className="cert-id">ID: {certId}</span>
              </div>
              <div className="cert-stamp">
                <Award size={18} /> AUTHORIZED TRAINING
              </div>
            </div>

            <p className="cert-disclaimer">
              Training / Unclassified · For awareness purposes only · Not a security clearance
            </p>
          </div>
        </div>

        {eligible && (
          <p style={{ marginTop: "1rem", color: "var(--olive-400)", fontSize: "0.9rem" }}>
            <Download size={14} style={{ verticalAlign: "middle" }} /> Use Print → Save as PDF in
            your browser to export this certificate.
          </p>
        )}
      </div>
    </div>
  );
}
