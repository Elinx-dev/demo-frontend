import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "../../theme/ThemeContext";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type TitleWeight = "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";

interface TitleProps {
    as?: HeadingLevel;
    children: ReactNode;
    weight?: TitleWeight;
    italic?: boolean;
    truncate?: boolean;
    className?: string;
    color?: string; // theme aware
    align?: "left" | "center" | "right";
    uppercase?: boolean;
    lowercase?: boolean;
    capitalize?: boolean;
    underline?: boolean;
    lineThrough?: boolean;
}

const defaultSizes: Record<HeadingLevel, string> = {
    h1: "text-5xl",
    h2: "text-4xl",
    h3: "text-3xl",
    h4: "text-2xl",
    h5: "text-xl",
    h6: "text-lg",
};

const weightClasses: Record<TitleWeight, string> = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
};

function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

const Title: React.FC<TitleProps> = ({
    as = "h1",
    children,
    weight = "bold",
    italic = false,
    truncate = false,
    className = "",
    color,
    align,
    uppercase = false,
    lowercase = false,
    capitalize = false,
    underline = false,
    lineThrough = false,
}) => {
    const { theme } = useTheme();
    const hasTextColorClass = /\b(?:text-|hover:text-)/.test(className ?? "");
    const themeColor = color ?? (hasTextColorClass ? undefined : theme.colors.text);

    const transformClass = uppercase
        ? "uppercase"
        : lowercase
            ? "lowercase"
            : capitalize
                ? "capitalize"
                : "";

    const textAlignClass = align ? `text-${align}` : "";

    const decorationClass = `${underline ? "underline" : ""} ${lineThrough ? "line-through" : ""
        }`;

    // ✅ This was missing before
    const Component = as;
    const level = Number(as.slice(1));
    const titleStyle: CSSProperties = themeColor ? { color: themeColor } : {};

    if (level <= 3) {
        titleStyle.fontFamily = "var(--ipc-font-display)";
    }

    return (
        <Component
            className={cn(
                defaultSizes[as],
                weightClasses[weight],
                italic && "italic",
                truncate && "truncate",
                transformClass,
                textAlignClass,
                decorationClass,
                className
            )}
            style={titleStyle}
        >
            {children}
        </Component>
    );
};

export default Title;

// Usage Example
//  <Title as="h1">The brown fox jumps over the lazy dog</Title>
//             <Title as="h2">The brown fox jumps over the lazy dog</Title>
//             <Title as="h3">The brown fox jumps over the lazy dog</Title>
//             <Title as="h4">The brown fox jumps over the lazy dog</Title>
//             <Title as="h5">The brown fox jumps over the lazy dog</Title>
//             <Title as="h6">The brown fox jumps over the lazy dog</Title>
