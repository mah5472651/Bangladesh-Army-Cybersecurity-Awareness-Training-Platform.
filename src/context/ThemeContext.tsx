import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ThemeContextValue {
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const KEY = "bd_army_high_contrast";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    try {
      localStorage.setItem(KEY, highContrast ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [highContrast]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((v) => !v);
  }, []);

  return (
    <ThemeContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
