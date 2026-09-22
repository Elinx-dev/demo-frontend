import React, { useEffect, useState, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { X } from "lucide-react";
import { Button } from "../Button/Button";
type AlertType = "success" | "error" | "warning" | "info";

type AlertPosition =
    | "inline"
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";

interface AlertProps {
    type?: AlertType;
    title?: string;
    message: string;
    open?: boolean; // controlled mode
    defaultOpen?: boolean; // uncontrolled mode
    duration?: number; // auto close
    dismissible?: boolean;
    position?: AlertPosition;
    onClose?: () => void;
    className?: string;
}
export const Alert: React.FC<AlertProps> = ({
    type = "info",
    title,
    message,
    open,
    defaultOpen = true,
    duration = 4000,
    dismissible = true,
    position = "inline",
    onClose,
    className = "",
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isVisible = isControlled ? open : internalOpen;

    useEffect(() => {
        if (!isVisible) return;
        if (duration !== 0 && position !== "inline") {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleClose = () => {
        if (!isControlled) setInternalOpen(false);
        onClose?.();
    };
    const positionStyles: Record<string, string> = {
        "top-right": "fixed top-4 right-4",
        "top-left": "fixed top-4 left-4",
        "top-center": "fixed top-4 left-1/2 -translate-x-1/2",
        "bottom-right": "fixed bottom-4 right-4",
        "bottom-left": "fixed bottom-4 left-4",
        "bottom-center": "fixed bottom-4 left-1/2 -translate-x-1/2",
    };

    const getTypeStyles = (): CSSProperties => {
        switch (type) {
            case "success":
                return {
                    background: `${c.success}15`,
                    borderColor: c.success,
                    color: c.success,
                };
            case "error":
                return {
                    background: `${c.danger}15`,
                    borderColor: c.danger,
                    color: c.danger,
                };
            case "warning":
                return {
                    background: `${c.warning}15`,
                    borderColor: c.warning,
                    color: c.warning,
                };
            default:
                return {
                    background: `${c.primary}15`,
                    borderColor: c.primary,
                    color: c.primary,
                };
        }
    };

    if (!isVisible) return null;

    return (
        <div
            role="alert"
            style={getTypeStyles()}
            className={`
        ${position !== "inline" ? positionStyles[position] : ""}
        relative
        min-w-[280px]
        max-w-md
        p-4
        border-l-4
        rounded-md
        shadow-md
        transition-all
        duration-300
        ${className}
      `}
        >
            {title && (
                <div className="font-semibold mb-1">
                    {title}
                </div>
            )}

            <div
                style={{ color: c.text }}
                className="text-sm"
            >
                {message}
            </div>

            {dismissible && (
                <Button
                    onClick={handleClose}
                    style={{ color: c.textMuted }}
                    className="absolute top-2 right-2 text-sm hover:opacity-100 opacity-70"
                >
                    <X />
                </Button>
            )}
        </div>
    );
};




//usage 
// <Alert
//   type="success"
//   message="Saved successfully"
//   position="top-right"
// />