/**
 * Sample multi-user training analytics for instructor/admin dashboards.
 * Used offline when the API is unavailable. Never includes real credentials.
 */

export interface TraineeStat {
  username: string;
  displayName: string;
  rank: string;
  unit: string;
  department: string;
  completedModules: number;
  totalModules: number;
  averageScore: number;
  awarenessScore: number;
  simClicks: number;
  formAttempts: number;
  lastActive: string;
  xp: number;
  level: number;
}

export interface DepartmentProgress {
  department: string;
  trainees: number;
  completionRate: number;
  avgScore: number;
  riskLevel: "Low" | "Medium" | "High";
}

export const SAMPLE_TRAINEES: TraineeStat[] = [
  {
    username: "trainee001",
    displayName: "Corporal Rahman",
    rank: "Cpl",
    unit: "Signals Battalion",
    department: "Signals",
    completedModules: 5,
    totalModules: 8,
    averageScore: 88,
    awarenessScore: 84,
    simClicks: 12,
    formAttempts: 3,
    lastActive: "2026-04-05",
    xp: 620,
    level: 4,
  },
  {
    username: "trainee002",
    displayName: "Lance Naik Karim",
    rank: "L/Nk",
    unit: "Infantry Regiment",
    department: "Infantry",
    completedModules: 3,
    totalModules: 8,
    averageScore: 76,
    awarenessScore: 68,
    simClicks: 18,
    formAttempts: 5,
    lastActive: "2026-04-04",
    xp: 310,
    level: 2,
  },
  {
    username: "trainee003",
    displayName: "Sergeant Akter",
    rank: "Sgt",
    unit: "Artillery Brigade",
    department: "Artillery",
    completedModules: 8,
    totalModules: 8,
    averageScore: 94,
    awarenessScore: 96,
    simClicks: 6,
    formAttempts: 1,
    lastActive: "2026-04-06",
    xp: 1420,
    level: 6,
  },
  {
    username: "trainee004",
    displayName: "Havildar Islam",
    rank: "Hav",
    unit: "Engineer Corps",
    department: "Engineers",
    completedModules: 6,
    totalModules: 8,
    averageScore: 81,
    awarenessScore: 79,
    simClicks: 9,
    formAttempts: 2,
    lastActive: "2026-04-03",
    xp: 780,
    level: 4,
  },
  {
    username: "trainee005",
    displayName: "Captain Noor",
    rank: "Capt",
    unit: "Cyber Defence Wing",
    department: "Cyber",
    completedModules: 8,
    totalModules: 8,
    averageScore: 97,
    awarenessScore: 98,
    simClicks: 4,
    formAttempts: 1,
    lastActive: "2026-04-06",
    xp: 1680,
    level: 6,
  },
  {
    username: "trainee006",
    displayName: "Naik Hassan",
    rank: "Nk",
    unit: "Logistics Command",
    department: "Logistics",
    completedModules: 2,
    totalModules: 8,
    averageScore: 62,
    awarenessScore: 55,
    simClicks: 22,
    formAttempts: 8,
    lastActive: "2026-04-01",
    xp: 140,
    level: 1,
  },
  {
    username: "trainee007",
    displayName: "Warrant Officer Reza",
    rank: "WO",
    unit: "Signals Battalion",
    department: "Signals",
    completedModules: 7,
    totalModules: 8,
    averageScore: 90,
    awarenessScore: 91,
    simClicks: 7,
    formAttempts: 2,
    lastActive: "2026-04-05",
    xp: 1100,
    level: 5,
  },
  {
    username: "trainee008",
    displayName: "Private Chowdhury",
    rank: "Pte",
    unit: "Infantry Regiment",
    department: "Infantry",
    completedModules: 1,
    totalModules: 8,
    averageScore: 70,
    awarenessScore: 48,
    simClicks: 15,
    formAttempts: 4,
    lastActive: "2026-03-28",
    xp: 95,
    level: 1,
  },
];

export const DEPARTMENT_PROGRESS: DepartmentProgress[] = [
  { department: "Signals", trainees: 2, completionRate: 75, avgScore: 89, riskLevel: "Low" },
  { department: "Infantry", trainees: 2, completionRate: 25, avgScore: 73, riskLevel: "High" },
  { department: "Artillery", trainees: 1, completionRate: 100, avgScore: 94, riskLevel: "Low" },
  { department: "Engineers", trainees: 1, completionRate: 75, avgScore: 81, riskLevel: "Medium" },
  { department: "Cyber", trainees: 1, completionRate: 100, avgScore: 97, riskLevel: "Low" },
  { department: "Logistics", trainees: 1, completionRate: 25, avgScore: 62, riskLevel: "High" },
];

export const MODULE_CLICK_RATES = [
  { module: "Email Phishing", clickRate: 34, submissions: 28 },
  { module: "Fake Login", clickRate: 41, submissions: 52 },
  { module: "QR Phishing", clickRate: 29, submissions: 18 },
  { module: "Smishing", clickRate: 37, submissions: 22 },
  { module: "Vishing", clickRate: 22, submissions: 12 },
  { module: "USB Security", clickRate: 18, submissions: 9 },
  { module: "Passwords", clickRate: 15, submissions: 6 },
  { module: "Social Eng.", clickRate: 31, submissions: 20 },
];

export const AWARENESS_TREND = [
  { month: "Nov", score: 62 },
  { month: "Dec", score: 68 },
  { month: "Jan", score: 74 },
  { month: "Feb", score: 79 },
  { month: "Mar", score: 84 },
  { month: "Apr", score: 87 },
];

export const RISK_HEATMAP = [
  { unit: "Signals Bn", email: 22, sms: 18, qr: 15, social: 20, overall: 19 },
  { unit: "Infantry Reg", email: 48, sms: 52, qr: 41, social: 55, overall: 49 },
  { unit: "Artillery Bde", email: 12, sms: 10, qr: 8, social: 14, overall: 11 },
  { unit: "Engineer Corps", email: 28, sms: 24, qr: 30, social: 26, overall: 27 },
  { unit: "Cyber Wing", email: 8, sms: 6, qr: 5, social: 7, overall: 6 },
  { unit: "Logistics", email: 55, sms: 61, qr: 48, social: 58, overall: 56 },
];
