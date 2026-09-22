import { useTheme } from "@/ui/theme/ThemeContext";
import React, {
    useState,
    useRef,
    useEffect,
    cloneElement,
    type ReactElement,
} from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom" | "left" | "right";
type Trigger = "hover" | "click" | "focus" | "manual";

interface TooltipProps {
    content: React.ReactNode;
    children: ReactElement;
    placement?: Placement;
    trigger?: Trigger;
    open?: boolean;
    defaultOpen?: boolean;
    offset?: number;
    followCursor?: boolean;
    interactive?: boolean;
    animationDuration?: number;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    placement = "top",
    trigger = "hover",
    open,
    defaultOpen = false,
    offset = 8,
    followCursor = false,
    interactive = false,
    animationDuration = 150,
    className = "",
}) => {
    const { theme } = useTheme();

    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const show = () => !isControlled && setInternalOpen(true);
    const hide = () => !isControlled && setInternalOpen(false);

    /* ---------------------------------- */
    /* 🔹 Positioning Logic */
    /* ---------------------------------- */

    const updatePosition: any = (cursorX?: number, cursorY?: number) => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        let top = 0;
        let left = 0;

        if (followCursor && cursorX && cursorY) {
            top = cursorY + offset;
            left = cursorX + offset;
        } else {
            switch (placement) {
                case "top":
                    top = triggerRect.top - tooltipRect.height - offset;
                    left =
                        triggerRect.left +
                        triggerRect.width / 2 -
                        tooltipRect.width / 2;
                    break;
                case "bottom":
                    top = triggerRect.bottom + offset;
                    left =
                        triggerRect.left +
                        triggerRect.width / 2 -
                        tooltipRect.width / 2;
                    break;
                case "left":
                    top =
                        triggerRect.top +
                        triggerRect.height / 2 -
                        tooltipRect.height / 2;
                    left = triggerRect.left - tooltipRect.width - offset;
                    break;
                case "right":
                    top =
                        triggerRect.top +
                        triggerRect.height / 2 -
                        tooltipRect.height / 2;
                    left = triggerRect.right + offset;
                    break;
            }
        }

        // Collision detection
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (left < 0) left = 8;
        if (left + tooltipRect.width > vw)
            left = vw - tooltipRect.width - 8;

        if (top < 0) top = 8;
        if (top + tooltipRect.height > vh)
            top = vh - tooltipRect.height - 8;

        setPosition({ top, left });
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener("scroll", updatePosition);
            window.addEventListener("resize", updatePosition);
        }
        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    /* ---------------------------------- */
    /* 🔹 Outside Click */
    /* ---------------------------------- */

    useEffect(() => {
        if (trigger !== "click") return;

        const handleClick = (e: MouseEvent) => {
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                hide();
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () =>
            document.removeEventListener("mousedown", handleClick);
    }, [trigger]);

    const triggerProps: any = {};

    if (trigger === "hover") {
        triggerProps.onMouseEnter = show;
        triggerProps.onMouseLeave = interactive ? undefined : hide;
    }

    if (trigger === "focus") {
        triggerProps.onFocus = show;
        triggerProps.onBlur = hide;
    }

    if (trigger === "click") {
        triggerProps.onClick = () =>
            isControlled ? null : setInternalOpen((prev) => !prev);
    }

    if (followCursor) {
        triggerProps.onMouseMove = (e: React.MouseEvent) =>
            updatePosition(e.clientX, e.clientY);
    }

    return (
        <>
            {cloneElement(children, {
                ref: triggerRef,
                ...triggerProps,
            })}

            {isOpen &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        role="tooltip"
                        className={`fixed z-[200] px-3 py-2 text-sm rounded-md shadow-lg ${className}`}
                        style={{
                            top: position.top,
                            left: position.left,
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            border: `1px solid ${theme.colors.primaryBorder}`,
                            boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
                            transition: `opacity ${animationDuration}ms ease`,
                        }}
                        onMouseEnter={interactive ? show : undefined}
                        onMouseLeave={interactive ? hide : undefined}
                    >
                        {content}
                    </div>,
                    document.body
                )}
        </>
    );
};






//usage

// <Tooltip content="Save changes">
//   <button>💾</button>
// </Tooltip>


// Click Trigger
// <Tooltip content="Click to confirm" trigger="click">
//   <button>Delete</button>
// </Tooltip>


// Follow Cursor
// <Tooltip content="Tracking cursor..." followCursor>
//   <div>Hover me</div>
// </Tooltip>



// Interactive Content
// <Tooltip
//   interactive
//   trigger="click"
//   content={
//     <div>
//       <p>Advanced settings</p>
//       <button>Edit</button>
//     </div>
//   }
// >
//   <button>Settings</button>
// </Tooltip>