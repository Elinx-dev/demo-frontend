import type { TelemetryEvent } from "./telemetry.types";

/**
 * TelemetryPort
 * -------------
 * Abstracts observability.
 * Engines emit events - implementations decide where they go.
 */
export interface TelemetryPort {
    track(event: TelemetryEvent): void;
}
