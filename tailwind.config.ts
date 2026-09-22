import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        // 🔵 BRAND

        navy: {
          50: "#F2F4F8",

          100: "#E6E9F0",

          200: "#C9CED9",

          300: "#A4ABC0",

          400: "#7A8199",

          500: "#555C73",

          600: "#3A4055",

          700: "#262B3E", // PRIMARY

          800: "#1A1F2D",

          900: "#0D1119",

          950: "#05070D",
        }, // ⚫ NEUTRAL

        ink: {
          50: "#FAFAF7",

          100: "#F1EFE8",

          200: "#D3D1C7",

          300: "#B4B2A9",

          400: "#888780",

          500: "#5F5E5A",

          600: "#444441",

          700: "#2C2C2A",

          800: "#1A1A1A",

          900: "#0A0A0A",
        }, // 🟢 SUCCESS

        success: {
          100: "#E1F5EE",

          500: "#1D9E75",

          700: "#0F6E56",

          900: "#04342C",
        }, // 🟡 WARNING

        warning: {
          100: "#FAEEDA",

          500: "#BA7517",

          700: "#854F0B",

          900: "#412402",
        }, // 🔴 DANGER

        danger: {
          100: "#FCEBEB",

          500: "#E24B4A",

          700: "#A32D2D",

          900: "#501313",
        }, // 🔵 INFO

        info: {
          100: "#E6F1FB",

          500: "#378ADD",

          700: "#0C447C",

          900: "#042C53",
        },
        ipc: {
          primary: "var(--ipc-primary)",
          "primary-light": "var(--ipc-primary-light)",
          "primary-border": "var(--ipc-primary-border)",
          background: "var(--ipc-background)",
          surface: "var(--ipc-surface)",
          text: "var(--ipc-text)",
          "text-muted": "var(--ipc-text-muted)",
          "text-secondary": "var(--ipc-text-secondary)",
          accent: "var(--ipc-accent)",
          hover: "var(--ipc-hover)",
          border: "var(--ipc-border)",
          success: "var(--ipc-success)",
          "success-bg": "var(--ipc-success-bg)",
          "success-text": "var(--ipc-success-text)",
          warning: "var(--ipc-warning)",
          "warning-bg": "var(--ipc-warning-bg)",
          "warning-text": "var(--ipc-warning-text)",
          danger: "var(--ipc-danger)",
          "danger-bg": "var(--ipc-danger-bg)",
          "danger-text": "var(--ipc-danger-text)",
          info: "var(--ipc-info)",
          "info-bg": "var(--ipc-info-bg)",
          "info-text": "var(--ipc-info-text)",
          canvas: "var(--ipc-canvas)",
          "navy-50": "var(--ipc-navy-50)",
          "status-active": "var(--ipc-status-active)",
          "status-expiring": "var(--ipc-status-expiring)",
          "status-expired": "var(--ipc-status-expired)",
          "status-syncing": "var(--ipc-status-syncing)",
          "status-draft": "var(--ipc-status-draft)",
        },
      },

      fontFamily: {
        display: ["Playfair Display", "serif"],

        sans: ["Inter", "system-ui", "sans-serif"],

        mono: ["JetBrains Mono", "monospace"],
      },

      spacing: {
        1: "2px",

        2: "4px",

        3: "6px",

        4: "8px",

        5: "12px",

        6: "16px",

        7: "20px",

        8: "24px",

        9: "32px",

        10: "40px",

        11: "48px",

        12: "64px",
      },

      borderRadius: {
        xs: "4px",

        sm: "6px",

        md: "8px",

        lg: "10px",

        xl: "12px",

        "2xl": "14px",

        "3xl": "24px",
      },

      boxShadow: {
        "ipc-sm": "var(--ipc-shadow-sm)",
        "ipc-md": "var(--ipc-shadow-md)",
        "ipc-lg": "var(--ipc-shadow-lg)",
        "ipc-xl": "var(--ipc-shadow-xl)",

        xs: "0 1px 2px rgba(38, 43, 62, 0.04)",
        sm: "0 2px 4px rgba(38, 43, 62, 0.06)",
        md: "0 4px 12px rgba(38, 43, 62, 0.08)",
        lg: "0 8px 24px rgba(38, 43, 62, 0.10)",
        xl: "0 16px 40px rgba(38, 43, 62, 0.12)",
      }
    },
  },

  plugins: [],
};

export default config;
