/**
 * DEMO TRAINING ACCOUNTS ONLY
 * These are fictional training credentials for internal awareness exercises.
 * No real emails, external auth providers, or production credentials are used.
 */

export type UserRole = "trainee" | "instructor" | "admin";

export interface DemoAccount {
  username: string;
  /** Demo password only — never a real credential */
  password: string;
  displayName: string;
  rank: string;
  unit: string;
  role: UserRole;
  department?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "trainee001",
    password: "Train@Demo1",
    displayName: "Corporal Rahman",
    rank: "Cpl",
    unit: "Signals Battalion",
    role: "trainee",
    department: "Signals",
  },
  {
    username: "trainee002",
    password: "Train@Demo2",
    displayName: "Lance Naik Karim",
    rank: "L/Nk",
    unit: "Infantry Regiment",
    role: "trainee",
    department: "Infantry",
  },
  {
    username: "instructor001",
    password: "Instruct@Demo1",
    displayName: "Major Hasan",
    rank: "Maj",
    unit: "Cyber Defence Wing",
    role: "instructor",
    department: "Cyber",
  },
  {
    username: "admin001",
    password: "Admin@Demo1",
    displayName: "Colonel Rahman",
    rank: "Col",
    unit: "Cyber Defence Wing",
    role: "admin",
    department: "Cyber",
  },
];

export function authenticateDemo(
  username: string,
  password: string
): DemoAccount | null {
  const account = DEMO_ACCOUNTS.find(
    (a) =>
      a.username.toLowerCase() === username.trim().toLowerCase() &&
      a.password === password
  );
  return account ?? null;
}

/** Reject any attempt to use real email-style logins */
export function isExternalEmail(value: string): boolean {
  const externalDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "protonmail.com",
    "mail.com",
  ];
  const lower = value.toLowerCase();
  if (!lower.includes("@")) return false;
  return externalDomains.some((d) => lower.endsWith("@" + d) || lower.includes("@" + d));
}
