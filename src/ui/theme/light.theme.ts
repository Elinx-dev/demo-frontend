import type { Theme } from "./theme.types";

export const lightTheme: Theme = {
  id: "light",
  name: "light",

  colors: {
    primary: "#3b82f6",
    primaryLight: "#f9fafb",
    primaryBorder: "#e5e7eb",
    background: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textSecondary: "#6b7280",
    accent: "#6366f1",
        hover: "#E5E5E0",


    border: "#e5e7eb",

    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",

    successBg: "#ecfdf5",
    successText: "#047857",
    warningBg: "#fffbeb",
    warningText: "#b45309",
    dangerBg: "#fef2f2",
    dangerText: "#b91c1c",
    infoBg: "#eff6ff",
    infoText: "#1d4ed8",

    statusActive: "#16a34a",
    statusExpiring: "#d97706",
    statusExpired: "#dc2626",
    statusSyncing: "#2563eb",
    statusDraft: "#6b7280",

    canvas: "#f9fafb",
    navy50: "#f8fafc",
  },

  fonts: {
    display: "Playfair Display, Georgia, serif",
    sans: "Inter, system-ui, sans-serif",
    mono: "JetBrains Mono, ui-monospace, monospace",
  },

	button: {
	  primary: "bg-blue-600 text-white hover:bg-blue-700",
	  secondary: "bg-white text-blue-600 border border-blue-600",
  outline: "border border-blue-600 text-blue-600",
  ghost: "text-blue-600 hover:bg-blue-50",
  danger: "bg-red-500 text-white",
  success: "bg-green-500 text-white",
}
  ,

  radius: {
    sm: "rounded-md",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  },

  shadow: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  },

  space: {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
  },

  motion: {
    duration: {
      fast: "120ms",
      base: "200ms",
      slow: "320ms",
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },
};
