import { Link } from "react-router-dom";
import { Home, ShieldAlert } from "lucide-react";
import ArmyLogo from "../components/ArmyLogo";
import GlassCard from "../components/GlassCard";
import PageTransition from "../components/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="section" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <GlassCard strong className="text-center" style={{ padding: "2.5rem 2rem" }}>
            <ArmyLogo size={72} />
            <div className="section-eyebrow" style={{ justifyContent: "center", marginTop: "1.25rem" }}>
              <ShieldAlert size={14} /> Route Not Found
            </div>
            <h1 style={{ marginBottom: "0.75rem" }}>404 — Page Unavailable</h1>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
              This path is not part of the Bangladesh Army Cybersecurity Awareness Training
              Platform. Return to the authorized training portal.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/" className="btn btn-primary">
                <Home size={16} /> Home
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Training Login
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}
