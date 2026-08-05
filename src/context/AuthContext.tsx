import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  authenticateDemo,
  isExternalEmail,
  type DemoAccount,
} from "../data/demoAccounts";
import { apiLogin, apiLogout } from "../lib/api";

interface AuthUser {
  username: string;
  displayName: string;
  rank: string;
  unit: string;
  role: DemoAccount["role"];
  department?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "bd_army_cyber_training_session";

function toUser(account: DemoAccount | AuthUser): AuthUser {
  return {
    username: account.username,
    displayName: account.displayName,
    rank: account.rank,
    unit: account.unit,
    role: account.role,
    department: "department" in account ? account.department : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.username) setUser(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      return { ok: false, error: "Username and password are required." };
    }

    if (isExternalEmail(normalizedUsername)) {
      return {
        ok: false,
        error:
          "External email providers are not permitted. Use training accounts only (e.g. trainee001).",
      };
    }

    if (
      normalizedUsername.includes("@") &&
      !normalizedUsername.toLowerCase().endsWith(".training.local")
    ) {
      return {
        ok: false,
        error: "Only internal training accounts are accepted. Do not use real email addresses.",
      };
    }

    // Prefer API when available; fall back to local demo auth
    const apiResult = await apiLogin(normalizedUsername, normalizedPassword);
    if (apiResult.ok) {
      const authUser: AuthUser = {
        username: apiResult.data.user.username,
        displayName: apiResult.data.user.displayName,
        rank: apiResult.data.user.rank,
        unit: apiResult.data.user.unit,
        role: apiResult.data.user.role,
        department: apiResult.data.user.department,
      };
      setUser(authUser);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      return { ok: true };
    }

    if (!apiResult.offline) {
      return { ok: false, error: apiResult.error || "Login failed" };
    }

    // Offline / local demo mode
    await new Promise((r) => setTimeout(r, 400));
    const account = authenticateDemo(normalizedUsername, normalizedPassword);
    if (!account) {
      return {
        ok: false,
        error: "Invalid training credentials. Use demo accounts listed below the form.",
      };
    }

    const authUser = toUser(account);
    setUser(authUser);
    // Store session identity only — never the password
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    void apiLogout();
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("bd_army_api_token");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
