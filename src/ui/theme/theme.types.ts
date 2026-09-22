export type ThemeName = "light" | "dark" | "ip";

export type Theme = {
  id?: string;
  name: ThemeName;

  colors: {
    // ── Core brand ──────────────────────────────────────────────
    primary: string;
    primaryLight: string;
    primaryBorder: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    accent: string;
    hover: string;
    border: string;

    // ── Semantic (solid) ────────────────────────────────────────
    success: string;
    warning: string;
    danger: string;
    info: string;

    // ── Semantic bg/text pairs (badges, pills, alerts) ──────────
    successBg: string;
    successText: string;
    warningBg: string;
    warningText: string;
    dangerBg: string;
    dangerText: string;
    infoBg: string;
    infoText: string;

    // ── Status dots (traffic-light) ─────────────────────────────
    statusActive: string;
    statusExpiring: string;
    statusExpired: string;
    statusSyncing: string;
    statusDraft: string;

    // ── Canvas / navy scale ─────────────────────────────────────
    canvas: string;       // page background
    navy50: string;       // table row hover
  };

  // ── Typography ──────────────────────────────────────────────────
  fonts: {
    display: string;   // Playfair Display - headings h1–h3, KPI numbers
    sans: string;      // Inter - UI body, h4–h6
    mono: string;      // JetBrains Mono - IDs, figures, numeric cells
  };

  button: {
    primary: string;
    secondary: string;
    outline: string;
    ghost: string;
    danger: string;
    success: string;
  };

  // ── Spacing scale (4px base, 20 steps) ─────────────────────────
  space: {
    "0": string;
    "1": string;
    "2": string;
    "3": string;
    "4": string;
    "5": string;
    "6": string;
    "8": string;
    "10": string;
    "12": string;
    "16": string;
    "20": string;
  };

  // ── Border radius ───────────────────────────────────────────────
  radius: {
    sm: string;   // 6px
    md: string;   // 8px
    lg: string;   // 10px
    xl: string;   // 12px
    "2xl": string; // 16px
    full: string; // 9999px
  };

  // ── Shadows (navy-tinted) ───────────────────────────────────────
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  // ── Motion ──────────────────────────────────────────────────────
  motion: {
    duration: {
      fast: string;   // 120ms
      base: string;   // 200ms
      slow: string;   // 320ms
    };
    easing: {
      standard: string;
      decelerate: string;
      spring: string;
    };
  };
};