import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AppChrome } from "@/layouts/AppChrome";
import { useTelemetry } from "@/services/telemetry/TelemetryContext";

export const AppShell = () => {
    const location = useLocation();
    const telemetry = useTelemetry();
    const prevPathRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const from = prevPathRef.current;
        const to = location.pathname;

        telemetry.track({
            type: "route_change",
            source: "navigation",
            timestamp: Date.now(),
            from,
            to,
        });

        prevPathRef.current = to;
    }, [location.pathname, telemetry]);

    return (
        <AppChrome>
            <Outlet />
        </AppChrome>
    );
};
