export type ModuleStatus = "locked" | "available" | "in_progress" | "completed";

export interface TrainingModule {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  objectives: string[];
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
  path: string;
  color: string;
}

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: "email-phishing",
    number: 1,
    title: "Email Phishing Awareness",
    shortTitle: "Email Phishing",
    description:
      "Identify fake sender addresses, suspicious links, dangerous attachments, urgent language, and spoofed domains in malicious emails.",
    objectives: [
      "Spot spoofed sender addresses and lookalike domains",
      "Inspect links before clicking",
      "Recognize high-risk attachment types",
      "Resist urgency and authority pressure tactics",
    ],
    duration: "20 min",
    difficulty: "Beginner",
    icon: "Mail",
    path: "/modules/email-phishing",
    color: "#e74c3c",
  },
  {
    id: "fake-login",
    number: 2,
    title: "Fake Login Awareness",
    shortTitle: "Fake Login",
    description:
      "Experience a simulated login page safely. Credentials are never stored or transmitted — only educational feedback is shown.",
    objectives: [
      "Verify URL and TLS certificate cues",
      "Detect cloned branding and layout anomalies",
      "Never enter real credentials on suspicious pages",
      "Report suspected credential harvesting attempts",
    ],
    duration: "15 min",
    difficulty: "Beginner",
    icon: "Lock",
    path: "/modules/fake-login",
    color: "#d4a017",
  },
  {
    id: "qr-phishing",
    number: 3,
    title: "QR Phishing Awareness",
    shortTitle: "QR Phishing",
    description:
      "Learn how malicious QR codes enable payment fraud, fake logins, and malware — and how to verify before scanning.",
    objectives: [
      "Understand QR-based attack vectors",
      "Verify destination URLs after scan",
      "Avoid payment and login QR codes from untrusted sources",
      "Apply physical-security verification habits",
    ],
    duration: "15 min",
    difficulty: "Intermediate",
    icon: "QrCode",
    path: "/modules/qr-phishing",
    color: "#9b59b6",
  },
  {
    id: "sms-phishing",
    number: 4,
    title: "SMS Phishing (Smishing)",
    shortTitle: "Smishing",
    description:
      "Recognize OTP scams, fake delivery messages, and banking fraud delivered via text messages.",
    objectives: [
      "Identify OTP and account-takeover smishing",
      "Spot fake courier and delivery scams",
      "Detect fraudulent banking SMS patterns",
      "Use official channels to verify requests",
    ],
    duration: "15 min",
    difficulty: "Beginner",
    icon: "MessageSquare",
    path: "/modules/sms-phishing",
    color: "#3498db",
  },
  {
    id: "voice-phishing",
    number: 5,
    title: "Voice Phishing Awareness",
    shortTitle: "Vishing",
    description:
      "Interactive scenarios covering social engineering over phone calls — authority, fear, and help-desk impersonation.",
    objectives: [
      "Recognize vishing social-engineering scripts",
      "Challenge unexpected verification requests",
      "Protect OTPs and credentials on calls",
      "Escalate suspicious calls through proper channels",
    ],
    duration: "20 min",
    difficulty: "Intermediate",
    icon: "Phone",
    path: "/modules/voice-phishing",
    color: "#1abc9c",
  },
  {
    id: "usb-security",
    number: 6,
    title: "USB Security",
    shortTitle: "USB Security",
    description:
      "Understand risks of unknown USB devices, rubber-ducky attacks, data exfiltration, and malware droppers.",
    objectives: [
      "Never plug in unknown or found USB devices",
      "Understand autorun and HID attack risks",
      "Follow approved media handling procedures",
      "Report lost or found removable media",
    ],
    duration: "12 min",
    difficulty: "Beginner",
    icon: "Usb",
    path: "/modules/usb-security",
    color: "#e67e22",
  },
  {
    id: "password-security",
    number: 7,
    title: "Password Security",
    shortTitle: "Passwords",
    description:
      "Build strong password hygiene: length, uniqueness, multi-factor authentication, and safe storage practices.",
    objectives: [
      "Create strong, unique passphrases",
      "Avoid reuse across systems",
      "Enable multi-factor authentication",
      "Use approved password managers securely",
    ],
    duration: "18 min",
    difficulty: "Beginner",
    icon: "KeyRound",
    path: "/modules/password-security",
    color: "#27ae60",
  },
  {
    id: "social-engineering",
    number: 8,
    title: "Social Engineering",
    shortTitle: "Social Eng.",
    description:
      "Interactive decision-based exercises covering pretexting, baiting, tailgating, and authority impersonation.",
    objectives: [
      "Recognize common social-engineering tactics",
      "Make safe decisions under pressure",
      "Verify identity through official channels",
      "Report suspicious approaches immediately",
    ],
    duration: "25 min",
    difficulty: "Advanced",
    icon: "Users",
    path: "/modules/social-engineering",
    color: "#c0392b",
  },
];

export const PLATFORM_STATS = {
  personnelTrained: 12840,
  modulesCompleted: 51280,
  phishingCaught: 92,
  avgScore: 87,
  activeUnits: 48,
  threatSims: 8,
};

export const AWARENESS_REASONS = [
  {
    title: "Human Firewall",
    description:
      "Technology alone cannot stop social engineering. Every soldier is a critical line of defence.",
    icon: "Shield",
  },
  {
    title: "Operational Security",
    description:
      "A single compromised account can expose unit movements, communications, and classified workflows.",
    icon: "Eye",
  },
  {
    title: "Nation-State Threats",
    description:
      "Adversaries target military personnel with tailored phishing and credential-harvesting campaigns.",
    icon: "Target",
  },
  {
    title: "Rapid Threat Evolution",
    description:
      "QR scams, deepfake voice calls, and AI-written emails require continuous awareness training.",
    icon: "Zap",
  },
];

export const TRAINING_OBJECTIVES = [
  "Recognize and report phishing emails and spoofed domains",
  "Never submit real credentials to untrusted or simulated pages",
  "Verify QR codes, SMS, and phone requests through official channels",
  "Handle removable media according to security policy",
  "Maintain strong password and MFA discipline",
  "Build a culture of cyber vigilance across all ranks",
];
