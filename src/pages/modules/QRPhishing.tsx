import { useState } from "react";
import { QrCode, AlertTriangle, CheckCircle2, Smartphone, CreditCard, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";

const module = TRAINING_MODULES[2];

const SCENARIOS = [
  {
    id: "qr1",
    title: "Canteen Payment QR",
    description:
      "A printed QR on a canteen table claims “Scan to pay mess bill — new UPI system.” The sticker covers an older official code.",
    risk: "Payment fraud — sticker overlay redirects to attacker wallet",
    safeAction: "Pay only via official mess/finance channels; verify with cashier",
    isMalicious: true,
  },
  {
    id: "qr2",
    title: "Unit Notice Board",
    description:
      "QR on the official notice board links to the published intranet bulletin confirmed by the adjutant’s weekly orders.",
    risk: "Low — published through official physical channel",
    safeAction: "Still preview the URL after scan before entering credentials",
    isMalicious: false,
  },
  {
    id: "qr3",
    title: "Parking “Wi-Fi Login”",
    description:
      "Poster in visitor parking: “Scan for Free Camp Wi-Fi Login.” Leads to a page asking for service number and password.",
    risk: "Login scam / credential harvest via free Wi-Fi lure",
    safeAction: "Use approved networks only; never scan unknown login QRs",
    isMalicious: true,
  },
];

export default function QRPhishing() {
  const { markComplete, getModuleProgress } = useProgress();
  const [selected, setSelected] = useState<Record<string, boolean | null>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(!!getModuleProgress(module.id)?.completed);

  const answer = (id: string, isMal: boolean) => {
    setSelected((s) => ({ ...s, [id]: isMal }));
    setRevealed((r) => ({ ...r, [id]: true }));
  };

  const finish = () => {
    let correct = 0;
    SCENARIOS.forEach((s) => {
      if (selected[s.id] === s.isMalicious) correct++;
    });
    const score = Math.round((correct / SCENARIOS.length) * 100);
    markComplete(module.id, score);
    setDone(true);
  };

  const allAnswered = SCENARIOS.every((s) => revealed[s.id]);

  return (
    <ModuleLayout module={module}>
      <div className="module-section">
        <h2>
          <QrCode size={20} className="text-gold" /> QR Code Threat Landscape
        </h2>
        <div className="lesson-grid">
          <div className="lesson-card">
            <h4>
              <Link2 size={14} /> Fake QR Codes
            </h4>
            <p>
              Stickers can be placed over legitimate codes. The camera cannot tell who printed
              the code — only the destination URL matters.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <CreditCard size={14} /> Payment Fraud
            </h4>
            <p>
              Malicious payment QRs divert funds to attacker accounts. Always confirm payee name
              matches the official merchant.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <Smartphone size={14} /> Login Scams
            </h4>
            <p>
              “Free Wi-Fi” and “Document download” QRs often open credential-harvesting pages on
              mobile browsers.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <CheckCircle2 size={14} /> Verify Before Scanning
            </h4>
            <p>
              Prefer official apps, typed URLs from directories, and physical verification of
              posters. Preview links after scan.
            </p>
          </div>
        </div>
      </div>

      <div className="module-section">
        <h2>Interactive Scenarios</h2>
        <p>Decide whether each QR situation is malicious or acceptable.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {SCENARIOS.map((s) => (
            <div
              key={s.id}
              style={{
                padding: "1.25rem",
                background: "rgba(0,0,0,0.3)",
                borderRadius: 14,
                border: "1px solid rgba(138,159,92,0.3)",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    flexShrink: 0,
                    background: `
                      repeating-linear-gradient(0deg, #111 0 4px, #d4a017 4px 8px),
                      repeating-linear-gradient(90deg, #111 0 4px, #d4a017 4px 8px)
                    `,
                    backgroundBlendMode: "difference",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--gold-600)",
                  }}
                >
                  <QrCode size={36} color="#0a1209" />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: "var(--white)", marginBottom: 6 }}>{s.title}</h4>
                  <p style={{ color: "var(--olive-300)", fontSize: "0.9rem", marginBottom: 12 }}>
                    {s.description}
                  </p>
                  {!revealed[s.id] ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => answer(s.id, true)}
                      >
                        <AlertTriangle size={14} /> Malicious
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => answer(s.id, false)}
                      >
                        <CheckCircle2 size={14} /> Acceptable
                      </button>
                    </div>
                  ) : (
                    <div>
                      {selected[s.id] === s.isMalicious ? (
                        <div className="alert alert-success">
                          <CheckCircle2 size={14} /> Correct.
                        </div>
                      ) : (
                        <div className="alert alert-danger">
                          <AlertTriangle size={14} /> Incorrect.
                        </div>
                      )}
                      <p style={{ marginTop: 8, fontSize: "0.88rem", color: "var(--olive-300)" }}>
                        <strong className="text-gold">Risk:</strong> {s.risk}
                        <br />
                        <strong className="text-gold">Safe action:</strong> {s.safeAction}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allAnswered && !done && (
          <button className="btn btn-primary mt-3" onClick={finish}>
            Complete Module
          </button>
        )}

        {done && (
          <div className="complete-banner">
            <div>
              <h3>Module 3 Complete</h3>
              <p>Score: {getModuleProgress(module.id)?.score ?? 0}%</p>
            </div>
            <Link to="/modules/sms-phishing" className="btn btn-primary">
              Next: Smishing →
            </Link>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
