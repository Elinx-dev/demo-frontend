// src/services/telemetry/TelemetryContext.tsx

import { createContext, useContext } from "react";
import type { TelemetryPort } from "./TelemetryPort";
import { consoleTelemetry } from "./ConsoleTelemetry";

const TelemetryContext = createContext<TelemetryPort | null>(null);

export const TelemetryProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    // ✅ Use the telemetry adapter directly (NO `new`)
    const telemetry: TelemetryPort = consoleTelemetry;

    return (
        <TelemetryContext.Provider value={telemetry}>
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetry = (): TelemetryPort => {
    const ctx = useContext(TelemetryContext);
    if (!ctx) {
        throw new Error(
            "useTelemetry must be used within TelemetryProvider"
        );
    }
    return ctx;
};
