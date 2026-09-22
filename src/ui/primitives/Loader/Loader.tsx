import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

type LoaderVariant = "spinner" | "dots" | "bar" | "skeleton";
type LoaderSize = "sm" | "md" | "lg";
type LoaderMode = "inline" | "overlay" | "fullscreen";

interface LoaderProps {
    open?: boolean;
    defaultOpen?: boolean;
    variant?: LoaderVariant;
    size?: LoaderSize;
    mode?: LoaderMode;
    message?: string;
    delay?: number;
    minDuration?: number;
    progress?: number;
    blurBackground?: boolean;
    className?: string;
}

const sizeMap: Record<LoaderSize, string> = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
};

export const Loader: React.FC<LoaderProps> = ({
    open,
    defaultOpen = false,
    variant = "spinner",
    size = "md",
    mode = "inline",
    message,
    delay = 0,
    minDuration = 300,
    progress = 0,
    blurBackground = false,
    className = "",
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const isControlled = open !== undefined;
    const [internalOpen] = useState(defaultOpen);
    const [visible, setVisible] = useState(false);
    const startTimeRef = useRef<number | null>(null);

    const isOpen = isControlled ? open : internalOpen;

    // ===============================
    // Delay + Minimum Duration Logic
    // ===============================
    useEffect(() => {
        let delayTimer: ReturnType<typeof setTimeout> | undefined;
        let minTimer: ReturnType<typeof setTimeout> | undefined;

        if (isOpen) {
            delayTimer = setTimeout(() => {
                startTimeRef.current = Date.now();
                setVisible(true);
            }, delay);
        } else {
            if (startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                const remaining = Math.max(minDuration - elapsed, 0);
                minTimer = setTimeout(() => {
                    setVisible(false);
                }, remaining);
            } else {
                setVisible(false);
            }
        }

        return () => {
            if (delayTimer) clearTimeout(delayTimer);
            if (minTimer) clearTimeout(minTimer);
        };
    }, [isOpen, delay, minDuration]);

    if (!visible) return null;

    // ===============================
    // Variant UI (Theme Based)
    // ===============================
    const renderLoader = () => {
        switch (variant) {
            case "spinner":
                return (
                    <div
                        style={{
                            borderColor: c.primaryBorder,
                            borderTopColor: c.primary,
                        }}
                        className={`${sizeMap[size]} rounded-full animate-spin`}
                    />
                );

            case "dots":
                return (
                    <div className="flex gap-1">
                        {[0, 150, 300].map((_, i) => (
                            <span
                                key={i}
                                style={{ background: c.primary }}
                                className="w-2 h-2 rounded-full animate-bounce"
                            />
                        ))}
                    </div>
                );

            case "bar":
                return (
                    <div
                        style={{ background: c.primaryBorder }}
                        className="w-48 h-2 rounded"
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                background: c.primary,
                            }}
                            className="h-full rounded transition-all duration-300"
                        />
                    </div>
                );

            case "skeleton":
                return (
                    <div className="space-y-2 w-full">
                        <div
                            style={{ background: c.primaryBorder }}
                            className="h-4 rounded animate-pulse"
                        />
                        <div
                            style={{ background: c.primaryBorder }}
                            className="h-4 rounded animate-pulse w-5/6"
                        />
                        <div
                            style={{ background: c.primaryBorder }}
                            className="h-4 rounded animate-pulse w-2/3"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    // ===============================
    // Base Content
    // ===============================
    const baseContent = (
        <div
            role="status"
            aria-busy="true"
            className={`flex flex-col items-center justify-center gap-3 ${className}`}
        >
            {renderLoader()}
            {message && (
                <p
                    style={{ color: c.textMuted }}
                    className="text-sm"
                >
                    {message}
                </p>
            )}
        </div>
    );

    // ===============================
    // Mode Handling
    // ===============================

    if (mode === "inline") {
        return baseContent;
    }

    if (mode === "overlay") {
        return (
            <div
                style={{
                    background: blurBackground
                        ? `${c.background}B3`
                        : `${c.background}CC`,
                }}
                className={`absolute inset-0 flex items-center justify-center z-40 ${blurBackground ? "backdrop-blur-sm" : ""
                    }`}
            >
                {baseContent}
            </div>
        );
    }

    if (mode === "fullscreen") {
        return (
            <div
                style={{
                    background: blurBackground
                        ? `${c.background}B3`
                        : c.background,
                }}
                className={`fixed inset-0 flex items-center justify-center z-50 ${blurBackground ? "backdrop-blur-sm" : ""
                    }`}
            >
                {baseContent}
            </div>
        );
    }

    return null;
};




//usage 

// const [loading, setLoading] = useState(false);

// <Loader open={loading} mode="fullscreen" message="Loading..." />