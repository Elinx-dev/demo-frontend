import type { Toast } from "./toast.types";
import { ToastItem } from "./ToastItem";

export const ToastContainer = ({
    toasts,
    onClose,
}: {
    toasts: Toast[];
    onClose: (id: string) => void;
}) => {
    return (
        <div
            className="fixed top-4 right-4 z-9999 space-y-2"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onClose={onClose} />
            ))}
        </div>
    );
};