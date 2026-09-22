import { createContext, useCallback, useContext, useState } from "react";

type Politeness = "polite" | "assertive";
type AnnounceFunction = (message: string, politeness?: Politeness) => void;

const ScreenReaderContext = createContext<AnnounceFunction>(() => {});

export const useSRAnnounce = (): AnnounceFunction =>
    useContext(ScreenReaderContext);

export const ScreenReaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [politeMsg, setPoliteMsg]       = useState("");
    const [assertiveMsg, setAssertiveMsg] = useState("");

    const announce = useCallback((message: string, politeness: Politeness = "polite") => {
        // Clear first, then set - forces re-announcement if same message fires twice
        if (politeness === "assertive") {
            setAssertiveMsg("");
            setTimeout(() => setAssertiveMsg(message), 50);
        } else {
            setPoliteMsg("");
            setTimeout(() => setPoliteMsg(message), 50);
        }
    }, []);

    return (
        <ScreenReaderContext.Provider value={announce}>
            {children}

            {/* Visually hidden live regions - screen readers only */}
            <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {politeMsg}
            </div>
            <div
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
            >
                {assertiveMsg}
            </div>
        </ScreenReaderContext.Provider>
    );
};