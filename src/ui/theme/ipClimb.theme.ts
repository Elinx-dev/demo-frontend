import type { Theme } from "./theme.types";

export const ipClimbTheme: Theme = {
  id: "ip",
  name: "ip",

  // ─────────────────────────────────────────────────────────
  // COLORS
  // All values taken directly from ip_climb_website_design_system_v1
  // ─────────────────────────────────────────────────────────
  colors: {
    // Core brand
    primary:       "#182343",
    primaryLight:  "#F5F5F3",
    primaryBorder: "#DAD8D2",
    background:    "#F3F3F1",
    surface:       "#FFFFFF",
    text:          "#001A44",
    textMuted:     "#8A8982",
    textSecondary: "#5F5E5A",   // FIXED: was #4E5664
    accent:        "#182343",
    hover:         "#101A35",
    border:        "#DAD8D2",

    // Semantic solid (corrected to design spec)
    success: "#1D9E75",   // FIXED: was #0E7668
    warning: "#BA7517",   // FIXED: was #9A5A13
    danger:  "#E24B4A",   // FIXED: was #B42318
    info:    "#2E6FB0",   // FIXED: was #0B4E8A

    // Semantic bg/text pairs - badges, alerts, pills
    successBg:   "#E1F5EE",
    successText: "#0F6E56",
    warningBg:   "#FAEEDA",
    warningText: "#854F0B",
    dangerBg:    "#FCEBEB",
    dangerText:  "#A32D2D",
    infoBg:      "#E6F1FB",
    infoText:    "#0C447C",

    // Status dots (traffic-light - portfolio tiles, agreement rows)
    statusActive:   "#639922",
    statusExpiring: "#EF9F27",
    statusExpired:  "#E24B4A",
    statusSyncing:  "#2E6FB0",
    statusDraft:    "#8A8982",

    // Canvas / navy scale
    canvas: "#FAFAF7",   // page background (slightly warmer than surface)
    navy50: "#F0F1F5",   // table row hover
  },

  // ─────────────────────────────────────────────────────────
  // FONTS
  // ─────────────────────────────────────────────────────────
  fonts: {
    display: "'Playfair Display', Georgia, 'Times New Roman', serif",
    sans:    "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono:    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },

  // ─────────────────────────────────────────────────────────
  // BUTTON CLASSES
  // Using --ipc-* CSS vars set in index.css
  // ─────────────────────────────────────────────────────────
  button: {
    primary:
      "bg-[var(--ipc-primary)] text-white border border-[var(--ipc-primary)] " +
      "hover:bg-[var(--ipc-hover)] hover:border-[var(--ipc-hover)] " +
      "focus-visible:ring-[3px] focus-visible:ring-[#CFD2DA] " +
      "transition-all duration-[120ms]",

    secondary:
      "bg-[var(--ipc-surface)] text-[var(--ipc-primary)] border border-[var(--ipc-border)] " +
      "hover:bg-[var(--ipc-primary-light)] " +
      "focus-visible:ring-[3px] focus-visible:ring-[#CFD2DA] " +
      "transition-all duration-[120ms]",

    outline:
      "bg-transparent text-[var(--ipc-primary)] border border-[var(--ipc-primary)] " +
      "hover:bg-[var(--ipc-primary-light)] " +
      "focus-visible:ring-[3px] focus-visible:ring-[#CFD2DA] " +
      "transition-all duration-[120ms]",

    ghost:
      "bg-transparent text-[var(--ipc-primary)] border border-transparent " +
      "hover:bg-[var(--ipc-primary-light)] " +
      "focus-visible:ring-[3px] focus-visible:ring-[#CFD2DA] " +
      "transition-all duration-[120ms]",

    danger:
      "bg-[var(--ipc-danger)] text-white border border-[var(--ipc-danger)] " +
      "hover:opacity-90 " +
      "focus-visible:ring-[3px] focus-visible:ring-[#FCEBEB] " +
      "transition-all duration-[120ms]",

    success:
      "bg-[var(--ipc-success)] text-white border border-[var(--ipc-success)] " +
      "hover:opacity-90 " +
      "focus-visible:ring-[3px] focus-visible:ring-[#E1F5EE] " +
      "transition-all duration-[120ms]",
  },

  // ─────────────────────────────────────────────────────────
  // SPACING (4px base grid)
  // ─────────────────────────────────────────────────────────
  space: {
    "0":  "0px",
    "1":  "4px",
    "2":  "8px",
    "3":  "12px",
    "4":  "16px",
    "5":  "20px",
    "6":  "24px",
    "8":  "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
    "20": "80px",
  },

  // ─────────────────────────────────────────────────────────
  // BORDER RADIUS (full 6-step scale)
  // ─────────────────────────────────────────────────────────
  radius: {
    sm:   "rounded-[6px]",
    md:   "rounded-[8px]",
    lg:   "rounded-[10px]",
    xl:   "rounded-[12px]",
    "2xl": "rounded-[16px]",
    full: "rounded-[9999px]",
  },

  // ─────────────────────────────────────────────────────────
  // SHADOWS (navy-tinted, not generic Tailwind black)
  // ─────────────────────────────────────────────────────────
  shadow: {
    sm: "shadow-[0_1px_3px_rgba(23,33,66,0.08)]",
    md: "shadow-[0_4px_12px_rgba(23,33,66,0.10)]",
    lg: "shadow-[0_8px_24px_rgba(23,33,66,0.10)]",
    xl: "shadow-[0_16px_40px_rgba(23,33,66,0.14)]",
  },

  // ─────────────────────────────────────────────────────────
  // MOTION TOKENS
  // ─────────────────────────────────────────────────────────
  motion: {
    duration: {
      fast: "120ms",
      base: "200ms",
      slow: "320ms",
    },
    easing: {
      standard:   "cubic-bezier(0.4, 0, 0.2, 1)",
      decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
      spring:     "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },
};