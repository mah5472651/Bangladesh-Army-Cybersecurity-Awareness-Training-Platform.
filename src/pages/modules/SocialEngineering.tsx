import { useState } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DoorOpen,
  Gift,
  Phone,
  IdCard,
} from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";

const module = TRAINING_MODULES.find((m) => m.id === "social-engineering")!;

interface DecisionScenario {
  id: string;
  title: string;
  icon: "door" | "gift" | "phone" | "id";
  situation: string;
  choices: { label: string; correct: boolean; explain: string }[];
}

const SCENARIOS: DecisionScenario[] = [
  {
    id: "s1",
    title: "Tailgating at the Gate",
    icon: "door",
    situation:
      "A person in civilian clothes carrying boxes approaches the secure building entrance behind you. They smile and say: “Hold the door — I’m with the contractor team and my badge is in the truck.”",
    choices: [
      {
        label: "Hold the door open — they look busy and trustworthy",
        correct: false,
        explain:
          "Tailgating is a classic physical social-engineering attack. Never allow piggybacking into controlled areas.",
      },
      {
        label: "Politely direct them to reception / security for proper check-in",
        correct: true,
        explain:
          "Correct. Access must be granted only through official verification. Be courteous but firm.",
      },
      {
        label: "Ignore them and walk away without reporting",
        correct: false,
        explain:
          "You should not grant access, but unexplained approaches to secure areas should be reported to security.",
      },
    ],
  },
  {
    id: "s2",
    title: "Baiting — Free USB Gift",
    icon: "gift",
    situation:
      "At a public event near the cantonment, free USB sticks labeled “Bangladesh Army Career Guide 2026” are handed out by an unknown stall with no official branding.",
    choices: [
      {
        label: "Take one and plug it into your office PC to review the guide",
        correct: false,
        explain:
          "Unknown USB media is a high-risk baiting vector (malware, rubber-ducky). Never plug untrusted devices into official systems.",
      },
      {
        label: "Refuse the gift and report the stall to unit security if near military areas",
        correct: true,
        explain:
          "Excellent. Free media near military facilities is a known collection and malware technique.",
      },
      {
        label: "Take it home and try it on a personal laptop first",
        correct: false,
        explain:
          "Personal devices can still be compromised and later used as a bridge to work accounts or data.",
      },
    ],
  },
  {
    id: "s3",
    title: "Pretexting — Fake Auditor",
    icon: "id",
    situation:
      "Someone calls claiming to be from “Internal Audit” and asks you to read aloud the last 10 lines of a classified logistics spreadsheet “for reconciliation before tomorrow’s inspection.”",
    choices: [
      {
        label: "Read the data — audits are official and urgent",
        correct: false,
        explain:
          "Pretexting uses a believable story. Classified or sensitive data is never shared over cold calls without verified procedure.",
      },
      {
        label: "Ask for a ticket number, hang up, and verify via your chain of command",
        correct: true,
        explain:
          "Correct. Independently verify using known contacts. Real auditors follow documented access procedures.",
      },
      {
        label: "Email the full spreadsheet to the address they provide",
        correct: false,
        explain:
          "Emailing sensitive data to an unverified address is data exfiltration risk — never do this.",
      },
    ],
  },
  {
    id: "s4",
    title: "Authority Impersonation",
    icon: "phone",
    situation:
      "A WhatsApp message from an unknown number claims to be your CO: “Need you to buy 5 prepaid cards for a covert task. Reimburse tomorrow. Do not tell anyone.”",
    choices: [
      {
        label: "Comply quickly — it is an order from the CO",
        correct: false,
        explain:
          "Impersonation of senior officers for money/gift cards is a widespread scam. Real orders do not use secret personal purchase schemes.",
      },
      {
        label: "Do not send money; verify through official unit channels face-to-face or known numbers",
        correct: true,
        explain:
          "Perfect. Challenge unusual financial or secrecy demands. Confirm identity out-of-band.",
      },
      {
        label: "Reply with your bank details so they can transfer funds first",
        correct: false,
        explain:
          "Sharing financial details with unknown contacts is another compromise path.",
      },
    ],
  },
];

const ICON_MAP = {
  door: DoorOpen,
  gift: Gift,
  phone: Phone,
  id: IdCard,
};

export default function SocialEngineering() {
  const { markComplete, getModuleProgress } = useProgress();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [done, setDone] = useState(!!getModuleProgress(module.id)?.completed);

  const scenario = SCENARIOS[idx];
  const Icon = ICON_MAP[scenario.icon];

  const choose = (choiceIdx: number) => {
    if (selected !== null) return;
    setSelected(choiceIdx);
    setAnswered((a) => a + 1);
    if (scenario.choices[choiceIdx].correct) setCorrectTotal((c) => c + 1);
  };

  const next = () => {
    if (idx < SCENARIOS.length - 1) {
      setIdx((i) => i + 1);
      setSelected(null);
    } else {
      const score = Math.round((correctTotal / SCENARIOS.length) * 100);
      // include current if last was correct already counted
      const finalCorrect =
        selected !== null && scenario.choices[selected].correct
          ? correctTotal
          : correctTotal;
      // correctTotal already updated on choose
      const finalScore = Math.round((finalCorrect / SCENARIOS.length) * 100);
      markComplete(module.id, Number.isFinite(finalScore) ? finalScore : score);
      setDone(true);
    }
  };

  if (done) {
    const score =
      getModuleProgress(module.id)?.score ??
      Math.round((correctTotal / SCENARIOS.length) * 100);
    return (
      <ModuleLayout module={module}>
        <div className="mod-complete">
          <CheckCircle2 size={48} color="#27ae60" />
          <h2>Social Engineering Module Complete</h2>
          <p>
            You finished interactive decision exercises on tailgating, baiting, pretexting, and
            authority impersonation. Score: <strong className="text-gold">{score}%</strong>
          </p>
          <div className="alert alert-info" style={{ textAlign: "left", marginTop: "1rem" }}>
            <Users size={18} />
            <div>
              <strong>Remember:</strong> Social engineering attacks the human decision process —
              not just technology. Verify identity, protect sensitive data, and report anomalies.
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <Link to="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
            <Link to="/certificate" className="btn btn-secondary">
              Certificate
            </Link>
            <Link to="/modules" className="btn btn-ghost">
              All Modules
            </Link>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  const choice = selected !== null ? scenario.choices[selected] : null;

  return (
    <ModuleLayout module={module}>
      <div className="mod-section">
        <div className="section-eyebrow">
          <Users size={14} /> Decision Exercise {idx + 1} / {SCENARIOS.length}
        </div>
        <div className="progress-track" style={{ marginBottom: "1.25rem" }}>
          <div
            className="progress-fill"
            style={{ width: `${((idx + (selected !== null ? 1 : 0)) / SCENARIOS.length) * 100}%` }}
          />
        </div>

        <div className="glass" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(192,57,43,0.15)",
                color: "#e74c3c",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon size={22} />
            </div>
            <h3 style={{ margin: 0 }}>{scenario.title}</h3>
          </div>
          <p style={{ color: "var(--olive-300)", lineHeight: 1.7 }}>{scenario.situation}</p>
        </div>

        <h4 style={{ marginBottom: "0.75rem" }}>What should you do?</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {scenario.choices.map((c, i) => {
            let border = "1px solid rgba(138,159,92,0.3)";
            let bg = "rgba(0,0,0,0.25)";
            if (selected !== null) {
              if (c.correct) {
                border = "1px solid rgba(39,174,96,0.6)";
                bg = "rgba(39,174,96,0.12)";
              } else if (selected === i) {
                border = "1px solid rgba(192,57,43,0.6)";
                bg = "rgba(192,57,43,0.12)";
              }
            }
            return (
              <button
                key={i}
                type="button"
                className="btn"
                onClick={() => choose(i)}
                disabled={selected !== null}
                style={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  whiteSpace: "normal",
                  height: "auto",
                  padding: "0.9rem 1rem",
                  background: bg,
                  border,
                  color: "var(--off-white)",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {choice && (
          <div
            className={`alert ${choice.correct ? "alert-success" : "alert-warning"}`}
            style={{ marginTop: "1.25rem" }}
          >
            {choice.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <div>
              <strong>{choice.correct ? "Correct decision" : "Risky decision"}</strong>
              <br />
              {choice.explain}
            </div>
          </div>
        )}

        {selected !== null && (
          <button type="button" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={next}>
            {idx < SCENARIOS.length - 1 ? "Next Scenario" : "Finish Module"}
          </button>
        )}

        <div className="alert alert-warning" style={{ marginTop: "1.5rem" }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Training notice:</strong> These scenarios are authorized awareness exercises
            only. They do not enable real social-engineering attacks.
          </div>
        </div>

        <p style={{ marginTop: "1rem", color: "var(--olive-400)", fontSize: "0.9rem" }}>
          Decisions answered: {answered} · Correct so far: {correctTotal}
        </p>
      </div>
    </ModuleLayout>
  );
}
