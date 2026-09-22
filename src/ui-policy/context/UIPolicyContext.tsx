import { createContext, useContext } from "react";

/* =========================
 * UI Policy Context (UI-ONLY)
 * =======================*/
export type UIPolicyContextType = {
    /** Capability check */
    can: (permissionKey: string) => boolean;

    /** DEV-only explainability */
    explain?: (permissionKey: string) => unknown;
};

/* =========================
 * Context
 * =======================*/
const UIPolicyContext =
    createContext<UIPolicyContextType | null>(null);

/* =========================
 * Provider
 * =======================*/
export const UIPolicyProvider = ({
    ctx,
    children,
}: {
    ctx: UIPolicyContextType;
    children: React.ReactNode;
}) => {
    return (
        <UIPolicyContext.Provider value={ctx}>
            {children}
        </UIPolicyContext.Provider>
    );
};

/* =========================
 * Hook
 * =======================*/
export const useUIPolicyContext = (): UIPolicyContextType => {
    const context = useContext(UIPolicyContext);
    if (!context) {
        throw new Error(
            "useUIPolicyContext must be used inside UIPolicyProvider"
        );
    }
    return context;
};
