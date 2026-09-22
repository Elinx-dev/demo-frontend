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
type TriggerType = "click" | "hover" | "focus" | "manual";

interface PopoverProps {
    trigger: ReactElement;
    content: React.ReactNode;
    placement?: Placement;
    triggerType?: TriggerType;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
    offset?: number;
    flip?: boolean;
    focusTrap?: boolean;
    closeOnOutsideClick?: boolean;
    closeOnEscape?: boolean;
    lazy?: boolean;
    unmountOnClose?: boolean;
    animationDuration?: number;
    className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
    trigger,
    content,
    placement = "bottom",
    triggerType = "click",
    open,
    onOpenChange,
    defaultOpen = false,
    offset = 8,
    flip = true,
    closeOnOutsideClick = true,
    closeOnEscape = true,
    lazy = true,
    unmountOnClose = false,
    animationDuration = 150,
    className = "",
}) => {
    const { theme } = useTheme();

    const triggerRef = useRef<HTMLElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const show = () => {
        if (!isControlled) setInternalOpen(true);
        onOpenChange?.(true);
    };
    const hide = () => {
        if (!isControlled) setInternalOpen(false);
        onOpenChange?.(false);
    };

    /* ---------------------------------- */
    /* 🔹 Smart Positioning + Flip */
    /* ---------------------------------- */

    const updatePosition = () => {
        if (!triggerRef.current || !popoverRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const popRect = popoverRef.current.getBoundingClientRect();

        let finalPlacement = placement;

        const computePosition = (place: Placement) => {
            switch (place) {
                case "top":
                    return {
                        top: triggerRect.top - popRect.height - offset,
                        left:
                            triggerRect.left +
                            triggerRect.width / 2 -
                            popRect.width / 2,
                    };
                case "bottom":
                    return {
                        top: triggerRect.bottom + offset,
                        left:
                            triggerRect.left +
                            triggerRect.width / 2 -
                            popRect.width / 2,
                    };
                case "left":
                    return {
                        top:
                            triggerRect.top +
                            triggerRect.height / 2 -
                            popRect.height / 2,
                        left: triggerRect.left - popRect.width - offset,
                    };
                case "right":
                    return {
                        top:
                            triggerRect.top +
                            triggerRect.height / 2 -
                            popRect.height / 2,
                        left: triggerRect.right + offset,
                    };
            }
        };

        let pos = computePosition(placement);

        if (flip) {
            if (pos.top < 0 && placement === "top") finalPlacement = "bottom";
            if (
                pos.top + popRect.height > window.innerHeight &&
                placement === "bottom"
            )
                finalPlacement = "top";
            if (pos.left < 0 && placement === "left") finalPlacement = "right";
            if (
                pos.left + popRect.width > window.innerWidth &&
                placement === "right"
            )
                finalPlacement = "left";

            pos = computePosition(finalPlacement);
        }

        pos.left = Math.max(
            8,
            Math.min(pos.left, window.innerWidth - popRect.width - 8)
        );
        pos.top = Math.max(
            8,
            Math.min(pos.top, window.innerHeight - popRect.height - 8)
        );

        setPosition(pos);
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
        if (!closeOnOutsideClick) return;

        const handler = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                hide();
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ---------------------------------- */
    /* 🔹 Escape Close */
    /* ---------------------------------- */

    useEffect(() => {
        if (!closeOnEscape) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") hide();
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const triggerProps: any = {};

    if (triggerType === "click") {
        triggerProps.onClick = () =>
            isControlled ? null : setInternalOpen((prev) => !prev);
    }

    if (triggerType === "hover") {
        triggerProps.onMouseEnter = show;
        triggerProps.onMouseLeave = hide;
    }

    if (triggerType === "focus") {
        triggerProps.onFocus = show;
        triggerProps.onBlur = hide;
    }

    return (
        <>
            {cloneElement(trigger, { ref: triggerRef, ...triggerProps })}

            {(isOpen || !lazy) &&
                createPortal(
                    (!unmountOnClose || isOpen) && (
                        <div
                            ref={popoverRef}
                            role="dialog"
                            className={`fixed z-50 rounded-md p-4 ${className}`}
                            style={{
                                top: position.top,
                                left: position.left,
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                border: `1px solid ${theme.colors.primaryBorder}`,
                                boxShadow:
                                    theme.name === "dark"
                                        ? "0 8px 24px rgba(0,0,0,0.5)"
                                        : "0 8px 24px rgba(0,0,0,0.08)",
                                transition: `opacity ${animationDuration}ms ease`,
                            }}
                        >
                            {content}
                        </div>
                    ),
                    document.body
                )}
        </>
    );
};





//usage 
// Interactive Form Inside
// <Popover
//     trigger={<button>Edit</button>}
//     content={
//         <form className="space-y-2">
//             <input placeholder="Name" />
//             <button type="submit">Save</button>
//         </form>
//     }
//     focusTrap
// />

// Nested Popover
// <Popover
//     trigger={<button>Open Parent</button>}
//     content={
//         <Popover
//             trigger={<button>Open Child</button>}
//             content={<div>Nested Content</div>}
//         />
//     }
// />

// Manual Controlled Mode
// <Popover
//   open={isOpen}
//   trigger={<button onClick={() => setIsOpen(true)}>Open</button>}
//   content={<DynamicPanel />}
// />