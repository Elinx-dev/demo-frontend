import React, { createContext, useContext, useEffect, useState } from "react";

type PolicyDebugContextType = {
    enabled: boolean;
    toggle: () => void;
};

const PolicyDebugContext = createContext<PolicyDebugContextType | null>(null);

export const PolicyDebugProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    if (!import.meta.env.DEV) {
        return <>{children}</>;
    }

    const [enabled, setEnabled] = useState(false);

    const toggle = () => setEnabled((v) => !v);

    // 🔥 Keyboard toggle: Ctrl + Shift + P
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "P") {
                toggle();
                console.info(
                    `%cPolicy Debug ${!enabled ? "ENABLED" : "DISABLED"}`,
                    "color: orange; font-weight: bold"
                );
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [enabled]);

    return (
        <PolicyDebugContext.Provider value={{ enabled, toggle }}>
            {children}
        </PolicyDebugContext.Provider>
    );
};

export function usePolicyDebug() {
    const ctx = useContext(PolicyDebugContext);

    if (!ctx) {
        return {
            enabled: false,
            toggle: () => { },
        };
    }

    return ctx;
}
