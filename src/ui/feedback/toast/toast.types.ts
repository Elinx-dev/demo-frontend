export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number;
};

export type ToastContextType = {
    toasts: Toast[];

    show: (toast: Omit<Toast, "id">) => void;

    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;

    remove: (id: string) => void;
};
