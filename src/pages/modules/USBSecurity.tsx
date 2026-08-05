import { useState } from "react";
import { Usb, AlertTriangle, CheckCircle2, HardDrive, Bug, FileWarning } from "lucide-react";
import { Link } from "react-router-dom";
import { TRAINING_MODULES } from "../../data/modules";
import { useProgress } from "../../context/ProgressContext";
import ModuleLayout from "../../components/ModuleLayout";

const module = TRAINING_MODULES[5];

const QUIZ = [
  {
    q: "You find a USB drive labelled “CO Salaries 2026” in the parking area. You should:",
    options: [
      "Plug it into your workstation to identify the owner",
      "Plug it into a personal laptop offline",
      "Leave it, report to security, and never connect it to any system",
      "Open it on a cyber café computer",
    ],
    answer: 2,
  },
  {
    q: "A “rubber ducky” USB device primarily:",
    options: [
      "Only stores photos",
      "Emulates a keyboard to inject malicious keystrokes",
      "Charges phones faster",
      "Is always safe if branded",
    ],
    answer: 1,
  },
  {
    q: "Approved removable media policy typically requires:",
    options: [
      "Any drive bought from the local market",
      "Encryption, inventory control, and scanning on approved kiosks",
      "Disabling all antivirus for speed",
      "Sharing one drive across all shifts freely",
    ],
    answer: 1,
  },
  {
    q: "AutoRun / AutoPlay on Windows is risky because:",
    options: [
      "It improves performance",
      "Malware can execute automatically when media is inserted",
      "It only works on CDs",
      "It encrypts the drive",
    ],
    answer: 1,
  },
];

export default function USBSecurity() {
  const { markComplete, getModuleProgress } = useProgress();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(!!getModuleProgress(module.id)?.completed);

  const submit = () => {
    let correct = 0;
    QUIZ.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    markComplete(module.id, Math.round((correct / QUIZ.length) * 100));
    setDone(true);
  };

  return (
    <ModuleLayout module={module}>
      <div className="module-section">
        <h2>
          <Usb size={20} className="text-gold" /> Risks of Unknown USB Devices
        </h2>
        <div className="lesson-grid">
          <div className="lesson-card">
            <h4>
              <Bug size={14} /> Malware Droppers
            </h4>
            <p>
              Infected drives can deliver ransomware, remote access trojans, or wipers the moment
              they are mounted.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <HardDrive size={14} /> Data Exfiltration
            </h4>
            <p>
              Insiders or attackers use removable media to copy sensitive files off air-gapped or
              restricted systems.
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <FileWarning size={14} /> HID Attacks
            </h4>
            <p>
              Devices that pretend to be keyboards can type malicious commands at superhuman
              speed without “opening a file.”
            </p>
          </div>
          <div className="lesson-card">
            <h4>
              <AlertTriangle size={14} /> Social Bait
            </h4>
            <p>
              Labels like “Confidential”, “Salaries”, or “Promotion List” exploit curiosity — a
              well-known attack called baiting.
            </p>
          </div>
        </div>
      </div>

      <div className="module-section">
        <h2>Standing Orders (Training Summary)</h2>
        <ul style={{ paddingLeft: 18, color: "var(--olive-300)", lineHeight: 1.8 }}>
          <li>Never plug in found, gifted, or unsolicited USB devices.</li>
          <li>Use only inventory-controlled, encrypted media approved by Signals/IT.</li>
          <li>Scan media on designated kiosks before any operational use.</li>
          <li>Disable AutoRun; keep endpoint protection active.</li>
          <li>Report lost or found media through security channels immediately.</li>
        </ul>
      </div>

      <div className="module-section">
        <h2>Assessment</h2>
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
            Submit & Complete Module
          </button>
        )}

        {done && (
          <div className="complete-banner">
            <div>
              <h3>
                <CheckCircle2 size={18} style={{ display: "inline", marginRight: 6 }} />
                Module 6 Complete
              </h3>
              <p>Score: {getModuleProgress(module.id)?.score ?? 0}%</p>
            </div>
            <Link to="/modules/password-security" className="btn btn-primary">
              Next: Passwords →
            </Link>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
