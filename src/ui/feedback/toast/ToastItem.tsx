import type { Toast } from "./toast.types";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

/* =========================
 * Variant Styles
 * =======================*/
const VARIANT_STYLES: Record<
  Toast["variant"],
  {
    bg: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: "bg-emerald-500/95",
    border: "border-emerald-400",
    icon: <CheckCircle2 size={20} />,
  },
  error: {
    bg: "bg-red-500/95",
    border: "border-red-400",
    icon: <XCircle size={20} />,
  },
  warning: {
    bg: "bg-amber-500/95",
    border: "border-amber-400",
    icon: <AlertTriangle size={20} />,
  },
  info: {
    bg: "bg-sky-500/95",
    border: "border-sky-400",
    icon: <Info size={20} />,
  },
};

type ToastItemProps = {
  toast: Toast;
  onClose: (id: string) => void;
};

export const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  const styles = VARIANT_STYLES[toast.variant];

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={
        toast.variant === "error" || toast.variant === "warning"
          ? "assertive"
          : "polite"
      }
      aria-atomic="true"
      style={{ animation: "toast-slide-in 0.3s ease forwards" }}
      className={`
        pointer-events-auto
        group
        flex
        min-w-[320px]
        max-w-[450px]
        items-start
        gap-4
        rounded-2xl
        border
        border-l-[5px]
        ${styles.border}
        ${styles.bg}
        px-5
        py-3
        text-white
        shadow-2xl
        backdrop-blur-md
        transition-all
        duration-300
        hover:scale-[1.02]
      `}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0 opacity-95">{styles.icon}</div>

      {/* Content */}
      <div className="flex-1">
        <p className="font-semibold capitalize">{toast.variant}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/90">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className="
          rounded-full
          p-1.5
          text-white/70
          transition
          duration-200
          hover:bg-white/20
          hover:text-white
        "
      >
        <X size={16} />
      </button>
    </div>
  );
};