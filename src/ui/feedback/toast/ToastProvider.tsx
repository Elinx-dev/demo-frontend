import { createContext, useContext, useState, useCallback } from "react";
import type { Toast, ToastContextType, ToastVariant } from "./toast.types";
import { ToastContainer } from "./ToastContainer";
import { useSRAnnounce } from "@/app/ScreenReaderProvider";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Safe UUID that works on HTTP (non-secure context) and HTTPS alike
const genId = (): string =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const announce = useSRAnnounce();

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback(
        (toast: Omit<Toast, "id">) => {
            const id = genId();
            setToasts(prev => [...prev, { ...toast, id }]);

            const politeness =
                toast.variant === "error" || toast.variant === "warning"
                    ? "assertive"
                    : "polite";
            announce(toast.message, politeness);

            setTimeout(() => remove(id), toast.duration ?? 3000);
        },
        [remove, announce]
    );

    const make =
        (variant: ToastVariant) =>
            (message: string) =>
                show({ message, variant });

    const value: ToastContextType = {
        toasts,
        show,
        success: make("success"),
        error: make("error"),
        info: make("info"),
        warning: make("warning"),
        remove,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                }}
            />
            <ToastContainer toasts={toasts} onClose={remove} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return ctx;
};