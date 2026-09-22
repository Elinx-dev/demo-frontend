// src/services/telemetry/ConsoleTelemetry.ts

import type { TelemetryPort } from "./TelemetryPort";
import type { TelemetryEvent } from "./telemetry.types";

export const consoleTelemetry: TelemetryPort = {
    track(event: TelemetryEvent) {
        // ✅ Dev-only telemetry (safe)
        if (!import.meta.env.DEV) return;

        const color = (() => {
            switch (event.type) {
                case "policy_denied":
                    return "color: red";
                case "policy_check":
                    return "color: green";
                case "workflow_transition":
                    return "color: blue";
                case "route_change":
                    return "color: purple";
                default:
                    return "color: gray";
            }
        })();

        // eslint-disable-next-line no-console
        console.log(
            `%c[Telemetry] ${event.type}`,
            color,
            event
        );
    },
};
