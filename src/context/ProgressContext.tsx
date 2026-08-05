import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { TRAINING_MODULES } from "../data/modules";
import {
  BADGES,
  evaluateBadges,
  getLevel,
  getNextLevel,
  levelProgressPercent,
  xpForModuleScore,
  type LevelDef,
} from "../data/gamification";
import { apiGetProgress, apiSaveProgress, apiRecordSimEvent } from "../lib/api";

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  score: number;
  attempts: number;
  completedAt?: string;
  quizAnswers?: Record<string, number>;
}

interface ProgressContextValue {
  progress: ModuleProgress[];
  markComplete: (moduleId: string, score: number) => void;
  recordAttempt: (moduleId: string) => void;
  recordSimEvent: (kind: "click" | "form_attempt", moduleId: string) => void;
  getModuleProgress: (moduleId: string) => ModuleProgress | undefined;
  overallPercent: number;
  completedCount: number;
  averageScore: number;
  resetProgress: () => void;
  totalXp: number;
  badges: string[];
  level: LevelDef;
  nextLevel: LevelDef | null;
  levelProgress: number;
  simClicks: number;
  formAttempts: number;
  awarenessScore: number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function storageKey(username: string) {
  return `bd_army_cyber_progress_${username}`;
}

function metaKey(username: string) {
  return `bd_army_cyber_meta_${username}`;
}

function emptyProgress(): ModuleProgress[] {
  return TRAINING_MODULES.map((m) => ({
    moduleId: m.id,
    completed: false,
    score: 0,
    attempts: 0,
  }));
}

interface MetaState {
  simClicks: number;
  formAttempts: number;
  awardedBadgeXp: string[];
}

function emptyMeta(): MetaState {
  return { simClicks: 0, formAttempts: 0, awardedBadgeXp: [] };
}

function mergeModuleProgress(source: ModuleProgress[]): ModuleProgress[] {
  return TRAINING_MODULES.map((m) => {
    const existing = source.find((p) => p.moduleId === m.id);
    return (
      existing ?? {
        moduleId: m.id,
        completed: false,
        score: 0,
        attempts: 0,
      }
    );
  });
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ModuleProgress[]>(emptyProgress);
  const [meta, setMeta] = useState<MetaState>(emptyMeta);

  useEffect(() => {
    if (!user) {
      setProgress(emptyProgress());
      setMeta(emptyMeta());
      return;
    }

    let cancelled = false;

    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(storageKey(user.username));
        if (raw) {
          const parsed = JSON.parse(raw) as ModuleProgress[];
          setProgress(mergeModuleProgress(parsed));
        } else {
          setProgress(emptyProgress());
        }
        const mraw = localStorage.getItem(metaKey(user.username));
        if (mraw) setMeta({ ...emptyMeta(), ...JSON.parse(mraw) });
        else setMeta(emptyMeta());
      } catch {
        setProgress(emptyProgress());
        setMeta(emptyMeta());
      }
    };

    loadLocal();

    // Prefer API progress when available (non-blocking)
    void (async () => {
      const res = await apiGetProgress();
      if (cancelled || !res.ok) return;

      if (res.data.progress?.length) {
        const merged = mergeModuleProgress(res.data.progress as ModuleProgress[]);
        setProgress(merged);
        localStorage.setItem(storageKey(user.username), JSON.stringify(merged));
      }

      // Sync sim event counts from API when present
      if (typeof res.data.simEvents === "number" && res.data.simEvents > 0) {
        setMeta((prev) => {
          // Keep local form/click breakdown when richer; only lift total floor
          const next = {
            ...prev,
            simClicks: Math.max(prev.simClicks, res.data.simEvents),
          };
          localStorage.setItem(metaKey(user.username), JSON.stringify(next));
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistProgress = useCallback(
    (next: ModuleProgress[]) => {
      setProgress(next);
      if (user) {
        localStorage.setItem(storageKey(user.username), JSON.stringify(next));
      }
    },
    [user]
  );

  const persistMeta = useCallback(
    (next: MetaState) => {
      setMeta(next);
      if (user) {
        localStorage.setItem(metaKey(user.username), JSON.stringify(next));
      }
    },
    [user]
  );

  const completedCount = progress.filter((p) => p.completed).length;
  const overallPercent = Math.round((completedCount / TRAINING_MODULES.length) * 100);
  const scored = progress.filter((p) => p.completed);
  const averageScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length);

  const moduleScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of progress) {
      if (p.completed) map[p.moduleId] = p.score;
    }
    return map;
  }, [progress]);

  const baseXp = useMemo(() => {
    return progress.reduce((sum, p) => {
      if (!p.completed) return sum;
      return sum + xpForModuleScore(p.score);
    }, 0);
  }, [progress]);

  const evalCtx = useMemo(
    () => ({
      completedCount,
      averageScore,
      totalXp: baseXp,
      moduleScores,
      simSubmissionCount: meta.formAttempts,
    }),
    [completedCount, averageScore, baseXp, moduleScores, meta.formAttempts]
  );

  const badges = useMemo(() => evaluateBadges(evalCtx), [evalCtx]);

  const badgeXp = useMemo(() => {
    return BADGES.filter((b) => badges.includes(b.id)).reduce((s, b) => s + b.xpReward, 0);
  }, [badges]);

  const totalXp = baseXp + badgeXp;
  const level = getLevel(totalXp);
  const nextLevel = getNextLevel(totalXp);
  const levelProgress = levelProgressPercent(totalXp);

  const awarenessScore = useMemo(() => {
    if (completedCount === 0) return 0;
    const completionWeight = (completedCount / TRAINING_MODULES.length) * 50;
    const scoreWeight = (averageScore / 100) * 40;
    const riskPenalty = Math.min(10, meta.formAttempts * 0.5 + meta.simClicks * 0.2);
    return Math.max(0, Math.min(100, Math.round(completionWeight + scoreWeight + 10 - riskPenalty)));
  }, [completedCount, averageScore, meta]);

  const markComplete = useCallback(
    (moduleId: string, score: number) => {
      setProgress((prev) => {
        const next = prev.map((p) =>
          p.moduleId === moduleId
            ? {
                ...p,
                completed: true,
                score: Math.max(p.score, score),
                attempts: p.attempts + 1,
                completedAt: p.completedAt ?? new Date().toISOString(),
              }
            : p
        );
        if (user) {
          localStorage.setItem(storageKey(user.username), JSON.stringify(next));
        }
        return next;
      });
      void apiSaveProgress({ moduleId, score, completed: true });
    },
    [user]
  );

  const recordAttempt = useCallback(
    (moduleId: string) => {
      setProgress((prev) => {
        const next = prev.map((p) =>
          p.moduleId === moduleId ? { ...p, attempts: p.attempts + 1 } : p
        );
        if (user) {
          localStorage.setItem(storageKey(user.username), JSON.stringify(next));
        }
        return next;
      });
    },
    [user]
  );

  const recordSimEvent = useCallback(
    (kind: "click" | "form_attempt", moduleId: string) => {
      setMeta((prev) => {
        const next: MetaState = {
          ...prev,
          simClicks: kind === "click" ? prev.simClicks + 1 : prev.simClicks,
          formAttempts: kind === "form_attempt" ? prev.formAttempts + 1 : prev.formAttempts,
        };
        if (user) {
          localStorage.setItem(metaKey(user.username), JSON.stringify(next));
        }
        return next;
      });
      void apiRecordSimEvent(kind, moduleId);
    },
    [user]
  );

  const getModuleProgress = useCallback(
    (moduleId: string) => progress.find((p) => p.moduleId === moduleId),
    [progress]
  );

  const resetProgress = useCallback(() => {
    const empty = emptyProgress();
    const m = emptyMeta();
    persistProgress(empty);
    persistMeta(m);
  }, [persistProgress, persistMeta]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        markComplete,
        recordAttempt,
        recordSimEvent,
        getModuleProgress,
        overallPercent,
        completedCount,
        averageScore,
        resetProgress,
        totalXp,
        badges,
        level,
        nextLevel,
        levelProgress,
        simClicks: meta.simClicks,
        formAttempts: meta.formAttempts,
        awarenessScore,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
