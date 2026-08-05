import { useState } from "react";
import { MessageSquare, AlertTriangle, CheckCircle2, Banknote, Package, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";

const module = TRAINING_MODULES[3];

interface SmsExample {
  id: string;
  from: string;
  text: string;
  type: string;
  isPhish: boolean;
  explain: string;
}

const MESSAGES: SmsExample[] = [
  {
    id: "s1",
    from: "BKASH-ALERT",
    text: "Your bKash PIN has been reset. If not you, confirm OTP 482193 at http://bkash-secure-login.xyz now or lose access.",
    type: "OTP / Account scam",
    isPhish: true,
    explain:
      "Legitimate providers never ask you to submit OTP on a third-party link. Domain is not official.",
  },
  {
    id: "s2",
    from: "Unit Signal Desk",
    text: "Reminder: Cyber awareness class at 0900 in Hall B. Bring notebook. — Sigs NCO",
    type: "Routine unit SMS",
    isPhish: false,
    explain: "No links, no OTP request, matches known training schedule pattern.",
  },
  {
    id: "s3",
    from: "Pathao/Courier",
    text: "Your parcel is held at customs. Pay clearance fee ৳850 here: bit.ly/clr-fee99 or it will be returned.",
    type: "Fake delivery",
    isPhish: true,
    explain: "Unexpected delivery fees via shortened links are classic smishing. Verify with official courier tracking.",
  },
  {
    id: "s4",
    from: "Bank-BD",
    text: "Dear Customer, unusual login detected. Verify account immediately: http://bank-bd-verify.com/login",
    type: "Banking fraud",
    isPhish: true,
    explain: "Banks do not use generic “Dear Customer” with shady verify links. Call the number on your card/app.",
  },
];

export default function SMSPhishing() {
  const { markComplete, getModuleProgress } = useProgress();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [done, setDone] = useState(!!getModuleProgress(module.id)?.completed);

  const msg = MESSAGES[idx];

  const judge = (isPhish: boolean) => {
    if (verdict !== null) return;
    setVerdict(isPhish);
    if (isPhish === msg.isPhish) setScore((s) => s + 1);
  };

  const next = () => {
    setIdx((i) => i + 1);
    setVerdict(null);
  };

  const finishLast = () => {
    // `score` already includes the last judgment from `judge`
    const pct = Math.round((score / MESSAGES.length) * 100);
    markComplete(module.id, pct);
    setDone(true);
  };

  return (
    <ModuleLayout module={module}>
      <div className="module-section">
        <h2>
          <MessageSquare size={20} className="text-gold" /> Smishing Threat Types
        </h2>
        <div className="lesson-grid">
          <div className="lesson-card">
            <h4>
              <KeyRound size={14} /> OTP Scams
            </h4>
            <p>
              Attackers already initiated a reset and need your OTP. Never share codes from SMS
              with anyone on a call or website.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <Package size={14} /> Fake Delivery
            </h4>
            <p>
              “Parcel held” messages push victims to pay fake fees or install malware via short
              links.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <Banknote size={14} /> Banking Fraud
            </h4>
            <p>
              Fake bank alerts create panic. Always open the official app or dial published
              support numbers — never links in SMS.
            </p>
          </div>
        </div>
      </div>

      {!done ? (
        <div className="module-section">
          <h2>
            Interactive Inbox ({idx + 1}/{MESSAGES.length})
          </h2>
          <div
            style={{
              maxWidth: 360,
              margin: "0 auto",
              background: "#0c100c",
              borderRadius: 24,
              border: "3px solid #2a3a2a",
              padding: "1rem 0.75rem 1.5rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: "0.7rem",
                color: "var(--olive-400)",
                marginBottom: 12,
                letterSpacing: "0.1em",
              }}
            >
              TRAINING HANDSET · SMS SIM
            </div>
            <div
              style={{
                background: "rgba(45,74,45,0.4)",
                borderRadius: 16,
                padding: "0.9rem 1rem",
                border: "1px solid rgba(138,159,92,0.25)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--gold-400)",
                  marginBottom: 6,
                }}
              >
                {msg.from}
              </div>
              <p style={{ color: "var(--off-white)", fontSize: "0.92rem", lineHeight: 1.5, margin: 0 }}>
                {msg.text}
              </p>
              <div style={{ marginTop: 8, fontSize: "0.7rem", color: "var(--olive-400)" }}>
                Type tag: {msg.type}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "stretch" }}>
              <button
                className="btn btn-danger btn-sm"
                style={{ flex: 1 }}
                disabled={verdict !== null}
                onClick={() => judge(true)}
              >
                Phishing
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                disabled={verdict !== null}
                onClick={() => judge(false)}
              >
                Safe
              </button>
            </div>

            {verdict !== null && (
              <div style={{ marginTop: 12 }}>
                {verdict === msg.isPhish ? (
                  <div className="alert alert-success">
                    <CheckCircle2 size={14} /> Correct
                  </div>
                ) : (
                  <div className="alert alert-danger">
                    <AlertTriangle size={14} /> Incorrect
                  </div>
                )}
                <p style={{ fontSize: "0.85rem", color: "var(--olive-300)", marginTop: 8 }}>
                  {msg.explain}
                </p>
                <button
                  className="btn btn-primary btn-sm mt-2"
                  style={{ width: "100%" }}
                  onClick={idx < MESSAGES.length - 1 ? next : finishLast}
                >
                  {idx < MESSAGES.length - 1 ? "Next Message" : "Complete Module"}
                </button>
              </div>
            )}
          </div>
          <p className="text-center text-muted mt-2" style={{ fontSize: "0.85rem" }}>
            Running score: {score}/{MESSAGES.length}
          </p>
        </div>
      ) : (
        <div className="complete-banner">
          <div>
            <h3>Module 4 Complete</h3>
            <p>Score: {getModuleProgress(module.id)?.score ?? 0}%</p>
          </div>
          <Link to="/modules/voice-phishing" className="btn btn-primary">
            Next: Vishing →
          </Link>
        </div>
      )}
    </ModuleLayout>
  );
}
