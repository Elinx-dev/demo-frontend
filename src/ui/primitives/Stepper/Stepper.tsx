import React, { type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { Button } from "../Button/Button";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface StepItem {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    status?: StepStatus;
}

export type StepperOrientation = "horizontal" | "vertical";
export type StepperSize = "sm" | "md" | "lg";
export type StepperVariant = "primary" | "success" | "danger" | "neutral";

interface StepperProps {
    steps: StepItem[];
    currentStep?: number;
    onStepChange?: (index: number) => void;
    orientation?: StepperOrientation;
    size?: StepperSize;
    clickable?: boolean;
    variant?: StepperVariant;
}

const circleSize: Record<StepperSize, string> = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
};

export const Stepper: React.FC<StepperProps> = ({
    steps,
    currentStep = 0,
    onStepChange,
    orientation = "horizontal",
    size = "md",
    clickable = true,
    variant = "primary",
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const isVertical = orientation === "vertical";

    // 🎨 Variant Color Resolver
    const getVariantColor = () => {
        switch (variant) {
            case "success":
                return c.success;
            case "danger":
                return c.danger;
            case "neutral":
                return c.textMuted;
            default:
                return c.primary;
        }
    };

    const activeColor = getVariantColor();

    const offset = 50 / (steps.length * 2);

    const getCircleStyle = (
        isActive: boolean,
        isCompleted: boolean,
        isError: boolean
    ): CSSProperties => {
        if (isError)
            return {
                background: c.danger,
                borderColor: c.danger,
                color: "#fff",
            };

        if (isCompleted || isActive)
            return {
                background: activeColor,
                borderColor: activeColor,
                color: "#fff",
            };

        return {
            background: c.surface,
            borderColor: c.primaryBorder,
            color: c.textMuted,
        };
    };

    const getLabelColor = (
        isActive: boolean,
        isCompleted: boolean,
        isError: boolean
    ) => {
        if (isError) return c.danger;
        if (isActive || isCompleted) return activeColor;
        return c.textMuted;
    };

    return (
        <div className="w-full">
            {/* ================= HORIZONTAL ================= */}
            {!isVertical && (
                <div className="relative w-full">
                    {/* Background Line */}
                    <div
                        className="absolute h-[2px]"
                        style={{
                            background: c.primaryBorder,
                            top: size === "sm" ? 12 : size === "md" ? 16 : 20,
                            left: `${offset}%`,
                            right: `${offset}%`,
                        }}
                    />

                    {/* Active Progress Line */}
                    <div
                        className="absolute h-[2px] transition-all duration-500"
                        style={{
                            background: activeColor,
                            top: size === "sm" ? 12 : size === "md" ? 16 : 20,
                            left: `${offset}%`,
                            width:
                                steps.length > 1
                                    ? `${(currentStep / (steps.length - 1)) *
                                    (100 - offset * 2)}%`
                                    : "0%",
                        }}
                    />

                    <div className="relative z-10 flex justify-between w-full">
                        {steps.map((step, index) => {
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;
                            const isError = step.status === "error";
                            const isDisabled = step.disabled;

                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    <Button
                                        disabled={isDisabled}
                                        onClick={() =>
                                            clickable &&
                                            !isDisabled &&
                                            onStepChange?.(index)
                                        }
                                        style={getCircleStyle(
                                            isActive,
                                            isCompleted,
                                            isError
                                        )}
                                        className={`
                      flex items-center justify-center rounded-full border-2 font-semibold
                      transition-all duration-300
                      ${circleSize[size]}
                      ${isDisabled
                                                ? "opacity-40 cursor-not-allowed"
                                                : clickable
                                                    ? "hover:scale-110 cursor-pointer"
                                                    : ""
                                            }
                    `}
                                    >
                                        {isCompleted ? "✓" : index + 1}
                                    </Button>

                                    <div className="mt-2.5 text-center">
                                        <div
                                            style={{
                                                color: getLabelColor(
                                                    isActive,
                                                    isCompleted,
                                                    isError
                                                ),
                                            }}
                                            className="font-medium"
                                        >
                                            {step.label}
                                        </div>

                                        {step.description && (
                                            <div
                                                style={{ color: c.textMuted }}
                                                className="text-xs mt-0.5"
                                            >
                                                {step.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ================= VERTICAL ================= */}
            {isVertical && (
                <div className="flex flex-col">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        const isError = step.status === "error";
                        const isDisabled = step.disabled;

                        return (
                            <div key={step.id} className="flex items-start">
                                <div className="flex flex-col items-center mr-4">
                                    <Button
                                        disabled={isDisabled}
                                        onClick={() =>
                                            clickable &&
                                            !isDisabled &&
                                            onStepChange?.(index)
                                        }
                                        style={getCircleStyle(
                                            isActive,
                                            isCompleted,
                                            isError
                                        )}
                                        className={`
                      shrink-0 flex items-center justify-center
                      rounded-full border-2 font-semibold
                      ${circleSize[size]}
                      ${isDisabled
                                                ? "opacity-40 cursor-not-allowed"
                                                : clickable
                                                    ? "hover:scale-110 cursor-pointer"
                                                    : ""
                                            }
                    `}
                                    >
                                        {isCompleted ? "✓" : index + 1}
                                    </Button>

                                    {index !== steps.length - 1 && (
                                        <div
                                            className="w-px flex-1 min-h-[2.5rem] mt-1.5 mb-1.5"
                                            style={{
                                                background:
                                                    index < currentStep
                                                        ? activeColor
                                                        : c.primaryBorder,
                                            }}
                                        />
                                    )}
                                </div>

                                <div className="pt-0.5 pb-8">
                                    <div
                                        style={{
                                            color: getLabelColor(
                                                isActive,
                                                isCompleted,
                                                isError
                                            ),
                                        }}
                                        className="font-medium"
                                    >
                                        {step.label}
                                    </div>

                                    {step.description && (
                                        <div
                                            style={{ color: c.textMuted }}
                                            className="text-xs mt-0.5"
                                        >
                                            {step.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};











//usage
//     const [currentStep, setCurrentStep] = useState(0);
//   const steps: StepItem[] = [
//         { id: "1", label: "Account Info" },
//         { id: "2", label: "Profile Details" },
//         { id: "3", label: "Confirmation" },
//     ];

//       <Stepper
//                 steps={steps}
//                 currentStep={currentStep}
//                 onStepChange={setCurrentStep}
//                 orientation="horizontal"
//                 size="md"
//                 variant="primary"
//             />