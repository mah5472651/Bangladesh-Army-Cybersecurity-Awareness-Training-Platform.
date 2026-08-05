import { useMemo, useState } from "react";
import { KeyRound, CheckCircle2, XCircle, Shield, Lock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";

const module = TRAINING_MODULES[6];

/** Strength meter for TRAINING passphrases only — never store the value */
function scorePassword(pw: string): { score: number; label: string; color: string; tips: string[] } {
  const tips: string[] = [];
  let score = 0;
  if (pw.length >= 12) score += 25;
  else tips.push("Use at least 12 characters (prefer 16+).");
  if (pw.length >= 16) score += 15;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 15;
  else tips.push("Mix upper and lower case.");
  if (/\d/.test(pw)) score += 15;
  else tips.push("Include numbers.");
  if (/[^A-Za-z0-9]/.test(pw)) score += 15;
  else tips.push("Include symbols.");
  if (!/(password|12345|qwerty|admin|army|bangladesh)/i.test(pw)) score += 15;
  else tips.push("Avoid common words and patterns.");

  let label = "Very Weak";
  let color = "#e74c3c";
  if (score >= 85) {
    label = "Strong";
    color = "#27ae60";
  } else if (score >= 65) {
    label = "Good";
    color = "#2ecc71";
  } else if (score >= 45) {
    label = "Fair";
    color = "#f39c12";
  } else if (score >= 25) {
    label = "Weak";
    color = "#e67e22";
  }
  return { score: Math.min(score, 100), label, color, tips };
}

const QUIZ = [
  {
    q: "The most important property of a password is usually:",
    options: ["Using your birthday for memorability", "Length and uniqueness", "Sharing it with your buddy for backup", "Writing it on the monitor"],
    answer: 1,
  },
  {
    q: "Multi-factor authentication (MFA) is valuable because:",
    options: [
      "It replaces the need for any password",
      "Stolen passwords alone are often not enough to sign in",
      "It slows down only attackers, never users",
      "It is optional for admin accounts",
    ],
    answer: 1,
  },
  {
    q: "Reusing the same password across systems is dangerous because:",
    options: [
      "One breach can unlock many accounts",
      "It makes typing faster",
      "Instructors require it",
      "It improves MFA",
    ],
    answer: 0,
  },
];

export default function PasswordSecurity() {
  const { markComplete, getModuleProgress } = useProgress();
  const [demoPw, setDemoPw] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(!!getModuleProgress(module.id)?.completed);

  const strength = useMemo(() => scorePassword(demoPw), [demoPw]);

  const submit = () => {
    let correct = 0;
    QUIZ.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const quizScore = (correct / QUIZ.length) * 70;
    const practiceScore = demoPw.length > 0 ? (strength.score / 100) * 30 : 0;
    // Discard demo password from state after scoring
    setDemoPw("");
    markComplete(module.id, Math.round(quizScore + practiceScore));
    setDone(true);
  };

  return (
    <ModuleLayout module={module}>
      <div className="module-section">
        <h2>
          <KeyRound size={20} className="text-gold" /> Password Security Principles
        </h2>
        <div className="lesson-grid">
          <div className="lesson-card">
            <h4>
              <Lock size={14} /> Length & Passphrases
            </h4>
            <p>
              Long passphrases (four+ random words) beat short complex strings that people reuse
              or write down insecurely.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <RefreshCw size={14} /> Uniqueness
            </h4>
            <p>
              One password per system. Credential stuffing attacks replay leaked passwords
              everywhere.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <Shield size={14} /> Multi-Factor Auth
            </h4>
            <p>
              Combine something you know with something you have (token/app) or are (biometric)
              per policy.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <CheckCircle2 size={14} /> Approved Managers
            </h4>
            <p>
              Use only organization-approved password managers. Never store passwords in plain
              browser notes or chat apps.
            </p>
          </div>
        </div>
      </div>

      <div className="module-section">
        <h2>Practice: Strength Meter (Training Only)</h2>
        <p>
          Type a <strong>fictional</strong> training passphrase to see strength feedback. The
          value is never saved — it is cleared when you complete the module.
        </p>
        <div className="form-group" style={{ maxWidth: 420 }}>
          <label className="form-label">Demo passphrase (do not use real passwords)</label>
          <input
            className="form-input"
            type="text"
            value={demoPw}
            onChange={(e) => setDemoPw(e.target.value)}
            placeholder="e.g. correct-horse-battery-practice"
            autoComplete="off"
            name="training-pass-demo"
            disabled={done}
          />
        </div>
        {demoPw && (
          <div style={{ maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
              <span className="text-muted">{strength.score}/100</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${strength.score}%`, background: strength.color }}
              />
            </div>
            {strength.tips.length > 0 && (
              <ul style={{ marginTop: 10, paddingLeft: 18, color: "var(--olive-300)", fontSize: "0.88rem" }}>
                {strength.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="alert alert-warning mt-2">
          <XCircle size={16} />
          Never type a real operational or personal password into training tools.
        </div>
      </div>

      <div className="module-section">
        <h2>Final Assessment</h2>
        {QUIZ.map((q, qi) => (
          <div key={qi} style={{ marginBottom: "1.4rem" }}>
            <p style={{ color: "var(--white)", fontWeight: 600, marginBottom: 8 }}>
              {qi + 1}. {q.q}
            </p>
            {q.options.map((opt, oi) => {
              let cls = "quiz-option";
              if (answers[qi] === oi) cls += " selected";
              if (done) {
                if (oi === q.answer) cls += " correct";
                else if (answers[qi] === oi) cls += " wrong";
              }
              return (
                <button
                  key={oi}
                  type="button"
                  className={cls}
                  disabled={done}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ))}

        {!done && (
          <button
            className="btn btn-primary"
            disabled={Object.keys(answers).length < QUIZ.length}
            onClick={submit}
          >
            Complete Final Module
          </button>
        )}

        {done && (
          <div className="complete-banner">
            <div>
              <h3>Module 7 Complete — Curriculum Finished</h3>
              <p>
                Score: {getModuleProgress(module.id)?.score ?? 0}% · Demo passphrase discarded.
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-primary">
              View Dashboard
            </Link>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
