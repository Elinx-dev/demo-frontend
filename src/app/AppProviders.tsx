import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { AuthProvider } from "./AuthContext";
import { PolicyBridge } from "@/ui-policy/context/PolicyBridge";
import { PolicyDebugProvider } from "@/ui-policy/context/PolicyDebugProvider";
import { TelemetryProvider } from "@/services/telemetry/TelemetryContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { ToastProvider } from "@/ui";
import { ScreenReaderProvider } from "./ScreenReaderProvider";
import { ProfileContextProvider } from "@/context/ProfileContext";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <TelemetryProvider>
                    <ThemeProvider>
                        {/* ✅ DEV-ONLY explainability toggle */}
                        <PolicyDebugProvider>
                            <PolicyBridge>
                                <ProfileContextProvider>
                                <ScreenReaderProvider>
                                    <ToastProvider>
                                        {children}
                                    </ToastProvider>
                                </ScreenReaderProvider>
                                </ProfileContextProvider>
                            </PolicyBridge>
                        </PolicyDebugProvider>
                    </ThemeProvider>
                </TelemetryProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};
