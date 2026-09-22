import type { HTMLAttributes } from "react";
import { useTheme } from "../../theme/ThemeContext";

type CardProps = HTMLAttributes<HTMLDivElement>; // ✅ includes className, style, onClick, etc.

export const Card = ({ children, className, style, ...rest }: CardProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ✅ skip inline bg/border if className is passed (so Tailwind wins)
    const themeStyles = className
        ? {}
        : {
            background: c.surface,
            color: c.text,
            border: `1px solid ${c.primaryBorder}`,
        };

    return (
        <div
            {...rest}
            className={`rounded-xl shadow-ipc-sm hover:shadow-ipc-md p-4 ${className ?? ""}`}
            style={{ ...themeStyles, ...style }} // ✅ inline style always wins over theme
        >
            {children}
        </div>
    );
};
