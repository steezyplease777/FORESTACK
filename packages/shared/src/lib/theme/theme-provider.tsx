
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PortalTheme, ThemeColors } from "./types";
import { resolveTheme, themeToCssVars } from "./defaults";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme-mode";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  customThemeEnabled = false,
  portalTheme = null,
  defaultMode = "system",
}: {
  children: React.ReactNode;
  customThemeEnabled?: boolean;
  portalTheme?: PortalTheme | null;
  defaultMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || defaultMode;
  });
  const [systemPref, setSystemPref] = useState<"light" | "dark">(
    getSystemPreference
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystemPref(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedMode = mode === "system" ? systemPref : mode;

  const { light, dark } = useMemo(
    () => resolveTheme(customThemeEnabled, portalTheme),
    [customThemeEnabled, portalTheme]
  );

  const activeTheme: Required<ThemeColors> =
    resolvedMode === "dark" ? dark : light;
  const cssVars = useMemo(() => themeToCssVars(activeTheme), [activeTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    for (const [prop, value] of Object.entries(cssVars)) {
      root.style.setProperty(prop, value);
    }

    return () => {
      for (const prop of Object.keys(cssVars)) {
        root.style.removeProperty(prop);
      }
    };
  }, [resolvedMode, cssVars]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, resolvedMode }),
    [mode, setMode, resolvedMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
