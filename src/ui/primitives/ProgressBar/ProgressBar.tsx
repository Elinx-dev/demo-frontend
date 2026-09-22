import { useTheme } from "@/ui/theme/ThemeContext";
import React from "react";

type ProgressStatus = "default" | "success" | "error";

type ProgressVariant =
    | "linear"
    | "striped"
    | "rounded"
    | "gradient"
    | "thin"
    | "thick";

type ProgressSize = "sm" | "md" | "lg";

type ProgressColor =
    | "primary"
    | "success"
    | "error"
    | "warning"
    | "amber"
    | "blue"
    | "sky"
    | "emerald"
    | "rose"
    | "accent";

interface ProgressBarProps {
    value?: number;
    buffer?: number;
    max?: number;
    showLabel?: boolean;
    label?: string;
    indeterminate?: boolean;
    status?: ProgressStatus;
    variant?: ProgressVariant;
    size?: ProgressSize;
    color?: ProgressColor;
    animated?: boolean;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value = 0,
    buffer,
    max = 100,
    showLabel = false,
    label,
    indeterminate = false,
    status = "default",
    variant = "linear",
    size = "md",
    color = "primary",
    animated = true,
    className = "",
}) => {
    const { theme } = useTheme();

    const percentage = Math.min((value / max) * 100, 100);

    const bufferPercentage =
        buffer !== undefined
            ? Math.min((buffer / max) * 100, 100)
            : undefined;

    const computedStatus: ProgressStatus =
        percentage >= 100 ? "success" : status;

    /* ---------------------------------- */
    /* 🎨 Theme Color Resolution */
    /* ---------------------------------- */

    const resolveColor = () => {
        if (computedStatus === "error") return theme.colors.danger;
        if (computedStatus === "success") return theme.colors.success;

        switch (color) {
            case "primary":
                return theme.colors.primary;
            case "success":
                return theme.colors.success;
            case "error":
                return theme.colors.danger;
            case "warning":
                return theme.colors.warning;
            case "accent":
                return theme.colors.accent;
            default:
                return theme.colors.primary;
        }
    };

    const progressColor = resolveColor();

    /* ---------------------------------- */
    /* 📏 Size Mapping */
    /* ---------------------------------- */

    const sizeMap: Record<ProgressSize, number> = {
        sm: 6,
        md: 8,
        lg: 12,
    };

    const height = sizeMap[size];

    const isRounded = variant === "rounded";
    const isStriped = variant === "striped";
    const isGradient = variant === "gradient";

    return (
        <div className={`w-full ${className}`}>
            <div
                className={`relative w-full overflow-hidden ${isRounded ? "rounded-full" : "rounded-md"
                    }`}
                style={{
                    height,
                    backgroundColor: theme.colors.primaryLight,
                }}
                role="progressbar"
                aria-valuenow={!indeterminate ? percentage : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                {/* Buffer */}
                {bufferPercentage !== undefined && !indeterminate && (
                    <div
                        className="absolute top-0 left-0 h-full transition-all duration-500 ease-out"
                        style={{
                            width: `${bufferPercentage}%`,
                            backgroundColor: theme.colors.primaryBorder,
                        }}
                    />
                )}

                {/* Indeterminate */}
                {indeterminate ? (
                    <div
                        className="absolute h-full w-1/3 animate-indeterminate"
                        style={{ backgroundColor: progressColor }}
                    />
                ) : (
                    <div
                        className={`h-full ${animated ? "transition-all duration-500 ease-out" : ""
                            }`}
                        style={{
                            width: `${percentage}%`,
                            background: isGradient
                                ? `linear-gradient(90deg, ${progressColor}, ${theme.colors.accent})`
                                : progressColor,
                            backgroundImage: isStriped
                                ? `repeating-linear-gradient(
                    45deg,
                    ${progressColor},
                    ${progressColor} 10px,
                    rgba(255,255,255,0.15) 10px,
                    rgba(255,255,255,0.15) 20px
                  )`
                                : undefined,
                        }}
                    />
                )}
            </div>

            {/* Label */}
            {showLabel && !indeterminate && (
                <div
                    className="mt-1 text-sm"
                    style={{ color: theme.colors.textMuted }}
                >
                    <span>{label}</span> {Math.round(percentage)}%
                </div>
            )}

            {/* Error Message */}
            {computedStatus === "error" && (
                <div
                    className="mt-1 text-sm"
                    style={{ color: theme.colors.danger }}
                >
                    Something went wrong
                </div>
            )}
        </div>
    );
};



//usage 
// <ProgressBar value={70} variant="gradient" />
