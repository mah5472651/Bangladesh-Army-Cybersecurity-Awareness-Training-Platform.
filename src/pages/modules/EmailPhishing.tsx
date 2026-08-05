import { useState } from "react";
import { Mail, AlertTriangle, CheckCircle2, XCircle, Link2, Paperclip } from "lucide-react";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";
import { Link } from "react-router-dom";

const module = TRAINING_MODULES[0];

const LESSONS = [
  {
    title: "Fake Sender Addresses",
    text: "Attackers spoof display names while using lookalike domains (e.g. army-bd.com vs army.mil.bd). Always expand the full From header.",
  },
  {
    title: "Suspicious Links",
    text: "Hover to preview URLs. Watch for misspellings, extra hyphens, IP addresses, and unexpected redirect chains.",
  },
  {
    title: "Attachment Risks",
    text: "Treat .exe, .js, .vbs, .iso, .html, and double extensions (invoice.pdf.exe) as high risk. Macros in Office files can deliver malware.",
  },
  {
    title: "Urgent Language",
    text: "Phrases like “Act within 1 hour”, “Account suspended”, or “Commander orders immediate action” are classic pressure tactics.",
  },
  {
    title: "Spoofed Domains",
    text: "Homograph attacks use similar characters (rn vs m). Verify domains against official unit directories before trusting mail.",
  },
];

interface EmailExample {
  id: string;
  from: string;
  subject: string;
  body: string;
  isPhish: boolean;
  redFlags: string[];
}

const EMAILS: EmailExample[] = [
  {
    id: "e1",
    from: "IT Support <it-support@banglades-army.com>",
    subject: "URGENT: Password Reset Required Within 30 Minutes",
    body: "Your account will be locked. Click here immediately to verify: http://192.168.99.12/reset-now",
    isPhish: true,
    redFlags: [
      "Misspelled domain (banglades-army.com)",
      "Urgent countdown pressure",
      "Raw IP address link",
      "Unsolicited password reset",
    ],
  },
  {
    id: "e2",
    from: "Unit Admin <admin@signals.army.training.local>",
    subject: "Weekly training roster — 12 Aug",
    body: "Please review the attached roster (PDF) on the shared drive link provided in last week’s official bulletin. No password required via email.",
    isPhish: false,
    redFlags: [],
  },
  {
    id: "e3",
    from: "Payroll <payroll@army-payslip.net>",
    subject: "Your salary slip is ready — open attachment",
    body: "Dear Soldier, open Salary_Slip_Aug.hta to view your payment. Failure to open may delay disbursement.",
    isPhish: true,
    redFlags: [
      "Unofficial domain (.net)",
      "Dangerous .hta attachment",
      "Threat of delayed pay",
      "Generic greeting",
    ],
  },
];

const QUIZ = [
  {
    q: "Which is the strongest indicator of a phishing email?",
    options: [
      "The email mentions your unit name",
      "A lookalike domain with urgent action demand",
      "The message is written in formal English",
      "It arrives during working hours",
    ],
    answer: 1,
  },
  {
    q: "Before clicking a link you should:",
    options: [
      "Click quickly so the offer does not expire",
      "Forward it to everyone in the unit",
      "Hover/inspect the real URL and verify the domain",
      "Download any attachment first",
    ],
    answer: 2,
  },
  {
    q: "A file named “Orders.pdf.exe” is:",
    options: [
      "A normal PDF",
      "A double-extension executable — high risk",
      "Safe if the icon looks like a PDF",
      "Required for training",
    ],
    answer: 1,
  },
];

export default function EmailPhishing() {
  const { markComplete, getModuleProgress } = useProgress();
  const [emailIdx, setEmailIdx] = useState(0);
  const [verdict, setVerdict] = useState<"phish" | "legit" | null>(null);
  const [emailScore, setEmailScore] = useState(0);
  const [emailDone, setEmailDone] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [finished, setFinished] = useState(!!getModuleProgress(module.id)?.completed);

  const email = EMAILS[emailIdx];

  const judge = (choice: "phish" | "legit") => {
    if (verdict) return;
    setVerdict(choice);
    const correct =
      (choice === "phish" && email.isPhish) || (choice === "legit" && !email.isPhish);
    if (correct) setEmailScore((s) => s + 1);
  };

  const nextEmail = () => {
    if (emailIdx < EMAILS.length - 1) {
      setEmailIdx((i) => i + 1);
      setVerdict(null);
    } else {
      setEmailDone(true);
    }
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
    let correct = 0;
    QUIZ.forEach((q, i) => {
      if (quizAnswers[i] === q.answer) correct++;
    });
    const exercisePct = Math.round((emailScore / EMAILS.length) * 100);
    const quizPct = Math.round((correct / QUIZ.length) * 100);
    const total = Math.round(exercisePct * 0.5 + quizPct * 0.5);
    markComplete(module.id, total);
    setFinished(true);
  };

  const finalScore = getModuleProgress(module.id)?.score ?? 0;

  return (
    <ModuleLayout module={module}>
      <div className="module-section">
        <h2>
          <Mail size={20} className="text-gold" /> Core Lessons
        </h2>
        <div className="lesson-grid">
          {LESSONS.map((l) => (
            <div key={l.title} className="lesson-card">
              <h4>{l.title}</h4>
              <p>{l.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="module-section">
        <h2>Interactive Exercise: Classify the Email</h2>
        <p>
          Review each message and decide if it is phishing or legitimate. Score: {emailScore}/
          {EMAILS.length}
        </p>

        {!emailDone ? (
          <div
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(138,159,92,0.3)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1.1rem",
                background: "rgba(26,46,26,0.8)",
                borderBottom: "1px solid rgba(212,160,23,0.15)",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <strong className="text-muted">From:</strong> {email.from}
              </div>
              <div>
                <strong className="text-muted">Subject:</strong> {email.subject}
              </div>
            </div>
            <div style={{ padding: "1.25rem 1.1rem", color: "var(--off-white)", lineHeight: 1.6 }}>
              {email.body}
              {email.isPhish && email.body.includes("http") && (
                <div
                  style={{
                    marginTop: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--danger-soft)",
                    fontSize: "0.85rem",
                  }}
                >
                  <Link2 size={14} /> Suspicious link present
                </div>
              )}
              {email.body.includes(".hta") && (
                <div
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--warning)",
                    fontSize: "0.85rem",
                  }}
                >
                  <Paperclip size={14} /> High-risk attachment referenced
                </div>
              )}
            </div>

            <div style={{ padding: "1rem 1.1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => judge("phish")}
                disabled={!!verdict}
              >
                <AlertTriangle size={14} /> Mark as Phishing
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => judge("legit")}
                disabled={!!verdict}
              >
                <CheckCircle2 size={14} /> Mark as Legitimate
              </button>
            </div>

            {verdict && (
              <div style={{ padding: "0 1.1rem 1.25rem" }}>
                {(verdict === "phish") === email.isPhish ? (
                  <div className="alert alert-success">
                    <CheckCircle2 size={16} /> Correct classification.
                  </div>
                ) : (
                  <div className="alert alert-danger">
                    <XCircle size={16} /> Incorrect. This email is{" "}
                    {email.isPhish ? "phishing" : "legitimate"}.
                  </div>
                )}
                {email.redFlags.length > 0 && (
                  <ul style={{ marginTop: 10, paddingLeft: 18, color: "var(--olive-300)", fontSize: "0.9rem" }}>
                    {email.redFlags.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
                <button className="btn btn-primary btn-sm mt-2" onClick={nextEmail}>
                  {emailIdx < EMAILS.length - 1 ? "Next Email" : "Finish Exercise"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            Exercise complete. You correctly classified {emailScore} of {EMAILS.length} emails.
          </div>
        )}
      </div>

      {emailDone && (
        <div className="module-section">
          <h2>Knowledge Check</h2>
          {QUIZ.map((q, qi) => (
            <div key={qi} style={{ marginBottom: "1.5rem" }}>
              <p style={{ color: "var(--white)", fontWeight: 600, marginBottom: 8 }}>
                {qi + 1}. {q.q}
              </p>
              {q.options.map((opt, oi) => {
                let cls = "quiz-option";
                if (quizAnswers[qi] === oi) cls += " selected";
                if (quizSubmitted) {
                  if (oi === q.answer) cls += " correct";
                  else if (quizAnswers[qi] === oi) cls += " wrong";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    disabled={quizSubmitted}
                    onClick={() => setQuizAnswers((a) => ({ ...a, [qi]: oi }))}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}
          {!quizSubmitted ? (
            <button
              className="btn btn-primary"
              disabled={Object.keys(quizAnswers).length < QUIZ.length}
              onClick={submitQuiz}
            >
              Submit Assessment
            </button>
          ) : null}
        </div>
      )}

      {finished && (
        <div className="complete-banner">
          <div>
            <h3>Module 1 Complete</h3>
            <p>Score recorded: {finalScore || getModuleProgress(module.id)?.score}%</p>
          </div>
          <Link to="/modules/fake-login" className="btn btn-primary">
            Next: Fake Login →
          </Link>
        </div>
      )}
    </ModuleLayout>
  );
}
