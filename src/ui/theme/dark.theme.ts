import type { Theme } from "./theme.types";

export const darkTheme: Theme = {
  id: "dark",
  name: "dark",

  colors: {
    primary: "#60a5fa",
    primaryLight: "#1f2937",
    primaryBorder: "#374151",
    background: "#111827",
    surface: "#1f2937",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    textSecondary: "#9ca3af",
    accent: "#818cf8",
        hover: "#E5E5E0",


    border: "#374151",

    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    info: "#60a5fa",

    successBg: "#064e3b",
    successText: "#a7f3d0",
    warningBg: "#78350f",
    warningText: "#fde68a",
    dangerBg: "#7f1d1d",
    dangerText: "#fecaca",
    infoBg: "#1e3a8a",
    infoText: "#bfdbfe",

    statusActive: "#34d399",
    statusExpiring: "#fbbf24",
    statusExpired: "#f87171",
    statusSyncing: "#60a5fa",
    statusDraft: "#9ca3af",

    canvas: "#111827",
    navy50: "#1f2937",
  },

  fonts: {
    display: "Playfair Display, Georgia, serif",
    sans: "Inter, system-ui, sans-serif",
    mono: "JetBrains Mono, ui-monospace, monospace",
  },

	button: {
	  primary: "bg-gray-700 text-white hover:bg-gray-600",
	  secondary: "bg-gray-800 text-white border border-gray-600",
  outline: "border border-gray-500 text-gray-200",
  ghost: "text-gray-200 hover:bg-gray-700",
  danger: "bg-red-700 text-white",
  success: "bg-green-700 text-white",
  },
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
