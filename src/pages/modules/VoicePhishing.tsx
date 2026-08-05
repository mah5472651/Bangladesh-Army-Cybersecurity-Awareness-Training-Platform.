import { useState } from "react";
import { Phone, User, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";

const module = TRAINING_MODULES[4];

interface Step {
  speaker: "caller" | "you" | "narrator";
  text: string;
  choices?: { label: string; correct: boolean; feedback: string }[];
}

const SCENARIO: Step[] = [
  {
    speaker: "narrator",
    text: "Scenario: You receive a call on your personal mobile from a number claiming to be “Signals Helpdesk — urgent account lockout.”",
  },
  {
    speaker: "caller",
    text: "Good afternoon. This is Sergeant Kabir from Cyber Defence helpdesk. Your VPN account shows suspicious foreign logins. I need to verify you — please read me the OTP that was just sent to your phone.",
  },
  {
    speaker: "you",
    text: "How do you respond?",
    choices: [
      {
        label: "Read the OTP so they can “secure” the account quickly",
        correct: false,
        feedback:
          "Never share OTPs. Real IT will not cold-call demanding codes. This is classic vishing.",
      },
      {
        label: "Refuse, hang up, and call the official helpdesk number from the unit directory",
        correct: true,
        feedback:
          "Correct. Independently verify using published numbers. Attackers exploit urgency and authority.",
      },
      {
        label: "Ask them to email you instead and then click any link they send",
        correct: false,
        feedback:
          "Shifting to email can still be phishing. Use official channels you initiate yourself.",
      },
    ],
  },
  {
    speaker: "narrator",
    text: "Follow-up: The caller becomes aggressive — “This is a direct order from the CO’s office. Non-compliance will be reported.”",
  },
  {
    speaker: "you",
    text: "What is the best action?",
    choices: [
      {
        label: "Comply because they invoked the Commanding Officer",
        correct: false,
        feedback:
          "Authority impersonation is a core social-engineering tactic. Legitimate orders do not require OTP disclosure on random calls.",
      },
      {
        label: "Stay calm, do not share secrets, report the call to your security officer",
        correct: true,
        feedback:
          "Excellent. Document time, number, and claims. Report through the chain of cyber incident procedures.",
      },
    ],
  },
];

export default function VoicePhishing() {
  const { markComplete, getModuleProgress } = useProgress();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [choiceTotal, setChoiceTotal] = useState(0);
  const [done, setDone] = useState(!!getModuleProgress(module.id)?.completed);

  const current = SCENARIO[step];

  const choose = (correct: boolean, fb: string) => {
    setFeedback(fb);
    setWasCorrect(correct);
    setChoiceTotal((t) => t + 1);
    if (correct) setCorrectCount((c) => c + 1);
  };

  const advance = () => {
    setFeedback(null);
    setWasCorrect(null);
    if (step < SCENARIO.length - 1) {
      setStep((s) => s + 1);
    } else {
      const score = choiceTotal > 0 ? Math.round((correctCount / choiceTotal) * 100) : 100;
      markComplete(module.id, score);
      setDone(true);
    }
  };

  // Auto-skip narrator-only on mount path handled by advance button

  return (
    <ModuleLayout module={module}>
      <div className="module-section">
        <h2>
          <Phone size={20} className="text-gold" /> Voice Phishing (Vishing)
        </h2>
        <p>
          Attackers use phone calls to impersonate IT support, banks, or senior officers. They
          combine fear, urgency, and authority to extract OTPs, passwords, or sensitive unit
          information.
        </p>
        <div className="lesson-grid">
          <div className="lesson-card">
            <h4>Authority Impersonation</h4>
            <p>Claiming to be CO staff, MP, or national CERT to override hesitation.</p>
          </div>
          <div className="lesson-card">
            <h4>Help-Desk Scripts</h4>
            <p>“We’re fixing your account” is a pretext to obtain credentials or remote access.</p>
          </div>
          <div className="lesson-card">
            <h4>OTP Harvesting</h4>
            <p>Live calls timed with login attempts — the OTP is the second factor they lack.</p>
          </div>
        </div>
      </div>

      {!done ? (
        <div className="module-section">
          <h2>Interactive Call Scenario</h2>
          <div
            style={{
              background: "rgba(0,0,0,0.35)",
              borderRadius: 16,
              border: "1px solid rgba(212,160,23,0.25)",
              padding: "1.5rem",
              minHeight: 220,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                color: "var(--gold-400)",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              <Phone size={14} /> LIVE TRAINING CALL · STEP {step + 1}/{SCENARIO.length}
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background:
                    current.speaker === "caller"
                      ? "rgba(231,76,60,0.2)"
                      : current.speaker === "you"
                        ? "rgba(212,160,23,0.2)"
                        : "rgba(138,159,92,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color:
                    current.speaker === "caller"
                      ? "#e74c3c"
                      : current.speaker === "you"
                        ? "var(--gold-400)"
                        : "var(--olive-300)",
                }}
              >
                {current.speaker === "caller" ? (
                  <User size={18} />
                ) : current.speaker === "you" ? (
                  <Shield size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--olive-400)",
                    marginBottom: 4,
                  }}
                >
                  {current.speaker === "caller"
                    ? "Caller"
                    : current.speaker === "you"
                      ? "Your Decision"
                      : "Briefing"}
                </div>
                <p style={{ color: "var(--off-white)", lineHeight: 1.6, margin: 0 }}>{current.text}</p>
              </div>
            </div>

            {current.choices && !feedback && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {current.choices.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    className="quiz-option"
                    onClick={() => choose(c.correct, c.feedback)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {feedback && (
              <div style={{ marginTop: 16 }}>
                <div className={`alert ${wasCorrect ? "alert-success" : "alert-danger"}`}>
                  {wasCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {feedback}
                </div>
                <button className="btn btn-primary btn-sm mt-2" onClick={advance}>
                  {step < SCENARIO.length - 1 ? "Continue" : "Finish Scenario"}
                </button>
              </div>
            )}

            {!current.choices && !feedback && (
              <button className="btn btn-primary btn-sm mt-3" onClick={advance}>
                Continue
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="complete-banner">
          <div>
            <h3>Module 5 Complete</h3>
            <p>Score: {getModuleProgress(module.id)?.score ?? 0}%</p>
          </div>
          <Link to="/modules/usb-security" className="btn btn-primary">
            Next: USB Security →
          </Link>
        </div>
      )}
    </ModuleLayout>
  );
}
