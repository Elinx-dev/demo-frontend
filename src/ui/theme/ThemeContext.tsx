import { createContext, useContext, useState, useEffect } from "react";

import { lightTheme } from "./light.theme";

import { darkTheme } from "./dark.theme";

import type { Theme, ThemeName } from "./theme.types";

import { ipClimbTheme } from "./ipClimb.theme";

// ─── Theme registry ───────────────────────────────────────────────────────────

const THEMES: Record<ThemeName, Theme> = {
  light: lightTheme,

  dark: darkTheme,

  ip: ipClimbTheme,
};

const DARK_THEMES: ThemeName[] = ["ip"];

const isValidTheme = (name: string): name is ThemeName => name in THEMES;

// ─── Context ──────────────────────────────────────────────────────────────────

type ThemeContextType = {
  theme: Theme;

  themeName: ThemeName;

  setTheme: (name: ThemeName) => void;

  toggleTheme: () => void;

  availableThemes: Theme[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>("ip");

  /* Hydrate from localStorage on boot */

  useEffect(() => {
    const stored = localStorage.getItem("theme");

    if (stored && isValidTheme(stored)) {
      setThemeName(stored);
    }
  }, []);

  /* Apply / remove Tailwind dark class */

  useEffect(() => {
    const root = document.documentElement;

    const theme = THEMES[themeName];

    if (DARK_THEMES.includes(themeName)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.dataset.theme = themeName;

    root.style.setProperty("--ipc-primary", theme.colors.primary);

    root.style.setProperty("--ipc-primary-light", theme.colors.primaryLight);

    root.style.setProperty("--ipc-primary-border", theme.colors.primaryBorder);

    root.style.setProperty("--ipc-background", theme.colors.background);

    root.style.setProperty("--ipc-surface", theme.colors.surface);

    root.style.setProperty("--ipc-text", theme.colors.text);

    root.style.setProperty("--ipc-text-muted", theme.colors.textMuted);

    root.style.setProperty("--ipc-text-secondary", theme.colors.textSecondary);

    root.style.setProperty("--ipc-accent", theme.colors.accent);

    root.style.setProperty("--ipc-hover", theme.colors.hover);

    root.style.setProperty("--ipc-border", theme.colors.border);

    root.style.setProperty("--ipc-success", theme.colors.success);

    root.style.setProperty("--ipc-warning", theme.colors.warning);

    root.style.setProperty("--ipc-danger", theme.colors.danger);

    root.style.setProperty("--ipc-info", theme.colors.info);
  }, [themeName]);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);

    localStorage.setItem("theme", name);
  };

  const toggleTheme = () => {
    setTheme(themeName === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: THEMES[themeName],

        themeName,

        setTheme,

        toggleTheme,

        availableThemes: Object.values(THEMES),
      }}
    >
       {children}
       {" "}
    </ThemeContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTheme = () => {
  const ctx = useContext(ThemeContext);

  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");

  return ctx;
};
