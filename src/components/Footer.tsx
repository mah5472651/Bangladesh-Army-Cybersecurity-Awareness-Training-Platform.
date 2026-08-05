import { AlertTriangle } from "lucide-react";
import ArmyLogo from "./ArmyLogo";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-inner">
        <div className="footer-brand">
          <ArmyLogo size={36} />
          <div>
            <strong>Bangladesh Army</strong>
            <p>Cybersecurity Awareness Training Platform</p>
          </div>
        </div>

        <div className="footer-notice">
          <AlertTriangle size={16} />
          <p>
            <strong>AUTHORIZED TRAINING USE ONLY.</strong> This platform never collects, stores, or
            transmits real user credentials. All simulations are educational. Unauthorized access
            is prohibited. No offensive phishing capability is provided.
          </p>
        </div>

        <div className="footer-meta">
          <span>© {new Date().getFullYear()} Bangladesh Army — Internal Training</span>
          <span className="footer-dot">·</span>
          <span>Classification: Training / Unclassified</span>
        </div>
      </div>
    </footer>
  );
}
