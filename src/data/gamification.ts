export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: (ctx: GamificationEval) => boolean;
}

export interface LevelDef {
  level: number;
  title: string;
  minXp: number;
}

export interface GamificationEval {
  completedCount: number;
  averageScore: number;
  totalXp: number;
  moduleScores: Record<string, number>;
  simSubmissionCount: number;
}

export const LEVELS: LevelDef[] = [
  { level: 1, title: "Recruit Defender", minXp: 0 },
  { level: 2, title: "Cyber Sentinel", minXp: 150 },
  { level: 3, title: "Threat Analyst", minXp: 350 },
  { level: 4, title: "Phish Hunter", minXp: 600 },
  { level: 5, title: "Cyber Defender", minXp: 900 },
  { level: 6, title: "Elite Guardian", minXp: 1300 },
  { level: 7, title: "Master of Awareness", minXp: 1800 },
];

export const BADGES: BadgeDef[] = [
  {
    id: "first-module",
    name: "First Contact",
    description: "Complete your first training module",
    icon: "Award",
    xpReward: 25,
    condition: (c) => c.completedCount >= 1,
  },
  {
    id: "half-way",
    name: "Halfway Hero",
    description: "Complete 4 training modules",
    icon: "Target",
    xpReward: 50,
    condition: (c) => c.completedCount >= 4,
  },
  {
    id: "full-curriculum",
    name: "Full Spectrum",
    description: "Complete all 8 training modules",
    icon: "Shield",
    xpReward: 150,
    condition: (c) => c.completedCount >= 8,
  },
  {
    id: "sharp-eye",
    name: "Sharp Eye",
    description: "Average score of 85% or higher",
    icon: "Eye",
    xpReward: 75,
    condition: (c) => c.completedCount >= 3 && c.averageScore >= 85,
  },
  {
    id: "perfect-module",
    name: "Perfect Drill",
    description: "Score 100% on any module",
    icon: "Star",
    xpReward: 40,
    condition: (c) => Object.values(c.moduleScores).some((s) => s >= 100),
  },
  {
    id: "sim-aware",
    name: "Simulation Aware",
    description: "Complete the fake-login awareness exercise",
    icon: "Lock",
    xpReward: 30,
    condition: (c) => (c.moduleScores["fake-login"] ?? 0) > 0,
  },
  {
    id: "social-master",
    name: "Social Engineer Spotter",
    description: "Complete the Social Engineering module",
    icon: "Users",
    xpReward: 50,
    condition: (c) => (c.moduleScores["social-engineering"] ?? 0) > 0,
  },
  {
    id: "phish-hunter",
    name: "Phish Hunter",
    description: "Complete Email, SMS, and QR phishing modules",
    icon: "Mail",
    xpReward: 60,
    condition: (c) =>
      (c.moduleScores["email-phishing"] ?? 0) > 0 &&
      (c.moduleScores["sms-phishing"] ?? 0) > 0 &&
      (c.moduleScores["qr-phishing"] ?? 0) > 0,
  },
];

export function xpForModuleScore(score: number): number {
  return 50 + Math.round(score * 0.75);
}

export function getLevel(totalXp: number): LevelDef {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXp) current = lvl;
  }
  return current;
}

export function getNextLevel(totalXp: number): LevelDef | null {
  const current = getLevel(totalXp);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

export function levelProgressPercent(totalXp: number): number {
  const current = getLevel(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 100;
  const span = next.minXp - current.minXp;
  const gained = totalXp - current.minXp;
  return Math.min(100, Math.round((gained / span) * 100));
}

export function evaluateBadges(ctx: GamificationEval): string[] {
  return BADGES.filter((b) => b.condition(ctx)).map((b) => b.id);
}
