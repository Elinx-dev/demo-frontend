/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server:{
    port: 3000,
  },
  /* =========================
   * Vitest Configuration
   * =======================*/
  test: {
    environment: "jsdom",
    globals: true,

    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "lcov"],

      /* 🔒 Engine-only coverage gate */
      include: [
        "src/ui-policy/**/*.{ts,tsx}",
        "src/navigation/**/*.{ts,tsx}",
        "src/workflows/**/*.{ts,tsx}",
        "src/services/api/**/*.{ts,tsx}",
      ],

      exclude: [
        "**/*.d.ts",
        "**/index.ts",
        "**/*.types.ts",
        "**/*.schemas.ts",
        "**/*.config.ts",
      ],

      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
