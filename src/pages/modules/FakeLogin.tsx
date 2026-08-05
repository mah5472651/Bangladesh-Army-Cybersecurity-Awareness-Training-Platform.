import { useState, type FormEvent } from "react";
import { Lock, AlertTriangle, ShieldAlert, CheckCircle2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";
import ArmyLogo from "../../components/ArmyLogo";
import "./FakeLogin.css";

const module = TRAINING_MODULES[1];

const WARNING_SIGNS = [
  {
    title: "Lookalike URL",
    detail:
      "The address bar shows army-webmail-secure.net instead of an official army domain. Attackers register similar names to harvest credentials.",
  },
  {
    title: "Missing HTTPS / certificate trust",
    detail:
      "In a real browser, always confirm the padlock and certificate issuer. Training pages may simulate insecure contexts deliberately.",
  },
  {
    title: "Unexpected login prompt",
    detail:
      "You did not navigate here from an official portal. Unexpected prompts after an email or QR scan are high risk.",
  },
  {
    title: "Urgency messaging",
    detail:
      "“Session expired — re-authenticate immediately” is designed to skip careful verification.",
  },
  {
    title: "Credential handling",
    detail:
      "This platform NEVER saves or transmits the password you type. It is replaced with ******** instantly and discarded from memory after the lesson.",
  },
];

export default function FakeLogin() {
  const { markComplete, getModuleProgress, recordSimEvent } = useProgress();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [maskedUser, setMaskedUser] = useState("");
  const [maskedPass, setMaskedPass] = useState("********");
  const [quiz, setQuiz] = useState<Record<number, number>>({});
  const [quizDone, setQuizDone] = useState(false);

  const alreadyDone = !!getModuleProgress(module.id)?.completed;

  /**
   * CRITICAL SAFETY: Never store or transmit real credentials.
   * On submit we immediately mask and discard the password value.
   */
  const handleSimSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Mask username partially for display; never keep raw password
    const u = username.trim() || "(empty)";
    const maskedU =
      u.length <= 2 ? "**" : u[0] + "*".repeat(Math.max(u.length - 2, 1)) + u[u.length - 1];

    // Immediately replace password with placeholder — raw value is NOT stored
    setMaskedUser(maskedU);
    setMaskedPass("********");
    setPassword(""); // discard from React state
    setUsername(""); // discard username from form state
    setSubmitted(true);
    // Count-only analytics — never credentials
    recordSimEvent("form_attempt", module.id);
    recordSimEvent("click", module.id);
  };

  const finishModule = () => {
    let correct = 0;
    if (quiz[0] === 1) correct++;
    if (quiz[1] === 2) correct++;
    if (quiz[2] === 0) correct++;
    const score = Math.round((correct / 3) * 100);
    // Participation credit: completing the safe simulation counts toward score
    const total = Math.max(score, submitted ? Math.round(score * 0.7 + 30) : score);
    markComplete(module.id, Math.min(total, 100));
    setQuizDone(true);
  };

  return (
    <ModuleLayout module={module}>
      <div className="sim-banner" style={{ borderRadius: 10, marginBottom: "1.5rem" }}>
        <ShieldAlert size={16} />
        SIMULATION ONLY — Do not enter real credentials. Nothing is saved or transmitted.
      </div>

      <div className="module-section">
        <h2>
          <Lock size={20} className="text-gold" /> Lesson: Credential Harvesting Pages
        </h2>
        <p>
          Fake login pages clone legitimate portals to steal usernames and passwords. Below is a
          deliberate simulation of a malicious webmail login. Interact with it to learn the
          warning signs — your input is destroyed immediately on submit.
        </p>
      </div>

      {!submitted ? (
        <div className="fake-login-stage">
          <div className="fake-browser">
            <div className="fake-browser-bar">
              <div className="fake-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="fake-url">
                <AlertTriangle size={12} color="#e74c3c" />
                <span className="fake-url-text">http://army-webmail-secure.net/login</span>
              </div>
            </div>
            <div className="fake-login-body">
              <div className="fake-brand">
                {/* Spoofed branding: attackers often clone official emblems */}
                <div className="fake-logo fake-logo-img" aria-hidden>
                  <ArmyLogo size={48} alt="" />
                </div>
                <h3>Army Webmail Portal</h3>
                <p className="fake-urgent">⚠ Session expired — re-authenticate immediately</p>
                <p className="fake-spoof-note">
                  Training note: cloned emblems do not make a page legitimate.
                </p>
              </div>
              <form onSubmit={handleSimSubmit} autoComplete="off">
                <div className="form-group">
                  <label className="form-label">Username / Service Number</label>
                  <input
                    className="form-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Use FAKE training text only"
                    autoComplete="off"
                    name="sim-user-discard"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Do NOT use a real password"
                    autoComplete="off"
                    name="sim-pass-discard"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Sign In
                </button>
                <p className="fake-fineprint">
                  By continuing you accept the portal terms… (cloned phishing page)
                </p>
              </form>
            </div>
          </div>
          <div className="alert alert-info" style={{ marginTop: "1rem" }}>
            <Eye size={16} />
            <span>
              Notice the red flags already visible: non-official domain, HTTP (not HTTPS), and
              urgent “session expired” pressure.
            </span>
          </div>
        </div>
      ) : (
        <div className="module-section">
          <div className="alert alert-danger mb-3">
            <ShieldAlert size={18} />
            <div>
              <strong>Educational outcome: this was a phishing login page.</strong>
              <br />
              Captured fields (masked for safety): Username display →{" "}
              <code>{maskedUser}</code> · Password → <code>{maskedPass}</code>
              <br />
              <em>
                The actual password characters were discarded immediately and were never stored,
                logged, or transmitted.
              </em>
            </div>
          </div>

          <h2>Warning Signs Present</h2>
          <div className="lesson-grid">
            {WARNING_SIGNS.map((w) => (
              <div key={w.title} className="lesson-card">
                <h4>{w.title}</h4>
                <p>{w.detail}</p>
              </div>
            ))}
          </div>

          <div className="alert alert-success mt-2">
            <CheckCircle2 size={16} />
            Correct response in the field: close the page, do not retry real credentials, and
            report the URL through your unit’s cyber incident channel.
          </div>
        </div>
      )}

      {(submitted || alreadyDone) && (
        <div className="module-section">
          <h2>Quick Assessment</h2>
          {[
            {
              q: "If a login page appears after clicking an email link, you should:",
              options: [
                "Enter your real password to check if it works",
                "Verify the official URL independently before signing in",
                "Disable antivirus and continue",
              ],
              answer: 1,
            },
            {
              q: "What does this training platform do with simulated passwords?",
              options: [
                "Stores them for instructor review",
                "Sends them to a security server",
                "Immediately discards them and shows ******** only",
              ],
              answer: 2,
            },
            {
              q: "Which URL is most suspicious for official webmail?",
              options: [
                "army-webmail-secure.net",
                "An official unit domain from the directory",
                "An intranet host published by Signals",
              ],
              answer: 0,
            },
          ].map((item, qi) => (
            <div key={qi} style={{ marginBottom: "1.25rem" }}>
              <p style={{ color: "var(--white)", fontWeight: 600, marginBottom: 8 }}>
                {qi + 1}. {item.q}
              </p>
              {item.options.map((opt, oi) => {
                let cls = "quiz-option";
                if (quiz[qi] === oi) cls += " selected";
                if (quizDone || alreadyDone) {
                  if (oi === item.answer) cls += " correct";
                  else if (quiz[qi] === oi) cls += " wrong";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    disabled={quizDone || alreadyDone}
                    onClick={() => setQuiz((q) => ({ ...q, [qi]: oi }))}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}

          {!quizDone && !alreadyDone && (
            <button
              className="btn btn-primary"
              disabled={Object.keys(quiz).length < 3 || !submitted}
              onClick={finishModule}
            >
              Complete Module
            </button>
          )}

          {(quizDone || alreadyDone) && (
            <div className="complete-banner">
              <div>
                <h3>Module 2 Complete</h3>
                <p>
                  Score: {getModuleProgress(module.id)?.score ?? 0}% · Credentials were never
                  stored.
                </p>
              </div>
              <Link to="/modules/qr-phishing" className="btn btn-primary">
                Next: QR Phishing →
              </Link>
            </div>
          )}
        </div>
      )}
    </ModuleLayout>
  );
}
