import boundaries from "eslint-plugin-boundaries";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    plugins: {
      boundaries,
    },

    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "domain", pattern: "src/domain/**" },
        { type: "ui-primitives", pattern: "src/ui/primitives/**" },
        { type: "ui-theme", pattern: "src/ui/theme/**" },
        { type: "ui-layout", pattern: "src/ui/layout/**" },
        { type: "ui-feedback", pattern: "src/ui/feedback/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "pages", pattern: "src/pages/**" },
        { type: "layouts", pattern: "src/layouts/**" },
        { type: "services", pattern: "src/services/**" },
        { type: "workflows", pattern: "src/workflows/**" },
        { type: "policy", pattern: "src/ui-policy/**" },
        { type: "navigation", pattern: "src/navigation/**" },
        { type: "masters", pattern: "src/masters/**" },
        { type: "utils", pattern: "src/utils/**" },
      ],
    },

    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "domain", allow: ["domain"] },

            { from: "ui-primitives", allow: ["ui-primitives"] },

            // ui-layout must stay PURE
            { from: "ui-layout", allow: ["ui-primitives", "ui-theme"] },

            { from: "ui-feedback", allow: ["ui-primitives"] },

            // composition root
            {
              from: "app",
              allow: [
                "domain",
                "ui-layout",
                "ui-feedback",
                "ui-theme",
                "policy",
                "services",
                "layouts",
              ],
            },

            // smart containers (allowed to use hooks)
            {
              from: "layouts",
              allow: [
                "ui-layout",
                "ui-primitives",
                "ui-theme",
                "navigation",
                "policy",
                "domain",
              ],
            },

            {
              from: "features",
              allow: [
                "domain",
                "ui-primitives",
                "ui-layout",
                "services",
                "policy",
              ],
            },

            {
              from: "pages",
              allow: [
                "features",
                "ui-layout",
                "ui-feedback",
                "layouts",
                "domain",
              ],
            },

            {
              from: "masters",
              allow: [
                "domain",
                "services",
                "ui-primitives",
                "ui-layout",
              ],
            },

            { from: "navigation", allow: ["domain", "policy"] },

            { from: "policy", allow: ["domain"] },

            {
              from: "workflows",
              allow: [
                "domain",
                "services",
                "ui-layout",
                "ui-primitives",
              ],
            },

            { from: "utils", allow: ["domain"] },
          ],
        },
      ],
    },
  },
];
