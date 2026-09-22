import { describe, it, expect } from "vitest";
import { ROUTES } from "@/navigation/routes";
import { navigationRegistry } from "@/navigation/NavigationRegistry";

/* =========================
 * Helpers
 * =======================*/

/** Collect all PATHS from ROUTES.PATHS recursively */
function collectRoutePaths(obj: any, acc = new Set<string>()) {
    Object.values(obj).forEach(value => {
        if (typeof value === "string") {
            acc.add(value);
        } else if (typeof value === "object" && value !== null) {
            collectRoutePaths(value, acc);
        }
    });
    return acc;
}

/** Collect all navigation paths recursively */
function collectNavPaths(nodes: typeof navigationRegistry, acc = new Set<string>()) {
    nodes.forEach(node => {
        if (node.path) acc.add(node.path);
        if (node.children) collectNavPaths(node.children, acc);
    });
    return acc;
}

/* =========================
 * Tests
 * =======================*/
describe("Route registry integrity (L5)", () => {
    it("all navigation paths exist in ROUTES.PATHS", () => {
        const routePaths = collectRoutePaths(ROUTES.PATHS);
        const navPaths = collectNavPaths(navigationRegistry);

        for (const path of navPaths) {
            expect(routePaths.has(path)).toBe(true);
        }
    });

    it("navigation must not use relative or raw paths", () => {
        const navPaths = collectNavPaths(navigationRegistry);

        for (const path of navPaths) {
            expect(path.startsWith("/")).toBe(true);
        }
    });

    it("all ROUTES.PATHS are absolute", () => {
        const routePaths = collectRoutePaths(ROUTES.PATHS);

        for (const path of routePaths) {
            expect(path.startsWith("/")).toBe(true);
        }
    });
});
