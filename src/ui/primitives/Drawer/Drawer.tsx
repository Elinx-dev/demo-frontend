import { useTheme } from "@/ui/theme/ThemeContext";
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

type Placement = "left" | "right" | "top" | "bottom";

interface DrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    placement?: Placement;
    size?: number | string;

    overlay?: boolean;
    persistent?: boolean;
    blurOverlay?: boolean;

    closeOnEsc?: boolean;
    closeOnOverlayClick?: boolean;

    animationDuration?: number;
    destroyOnClose?: boolean;

    swipeToClose?: boolean;
    responsiveBreakpoint?: number;

    zIndex?: number;

    children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
    open,
    onOpenChange,
    placement = "right",
    size = 400,
    overlay = true,
    persistent = false,
    blurOverlay = false,
    closeOnEsc = true,
    closeOnOverlayClick = true,
    animationDuration = 300,
    destroyOnClose = false,
    swipeToClose = true,
    responsiveBreakpoint = 768,
    zIndex = 1000,
    children,
}) => {
    const { theme } = useTheme();
    const drawerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);

    /* ---------------------------------- */
    /* ESC Close */
    /* ---------------------------------- */

    useEffect(() => {
        if (!open || !closeOnEsc) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open]);

    /* ---------------------------------- */
    /* Scroll Lock */
    /* ---------------------------------- */

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
    }, [open]);

    /* ---------------------------------- */
    /* Focus Management */
    /* ---------------------------------- */

    useEffect(() => {
        if (!open) return;

        const focusable = drawerRef.current?.querySelector<
            HTMLButtonElement | HTMLInputElement | HTMLAnchorElement
        >("button, input, a, textarea, select");

        focusable?.focus();
    }, [open]);

    /* ---------------------------------- */
    /* Swipe Support */
    /* ---------------------------------- */

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!swipeToClose) return;

        const endX = e.changedTouches[0].clientX;
        const diff = startX.current - endX;

        if (placement === "right" && diff > 80) onOpenChange(false);
        if (placement === "left" && diff < -80) onOpenChange(false);
    };

    if (!open && destroyOnClose) return null;

    const isMobile = window.innerWidth < responsiveBreakpoint;

    const getTransform = () => {
        if (open) return "translate(0)";
        switch (placement) {
            case "left":
                return "translateX(-100%)";
            case "right":
                return "translateX(100%)";
            case "top":
                return "translateY(-100%)";
            case "bottom":
                return "translateY(100%)";
        }
    };

    const drawer = (
        <>
            {/* Overlay */}
            {overlay && !persistent && (
                <div
                    style={{
                        zIndex,
                        backdropFilter: blurOverlay ? "blur(6px)" : undefined,
                        transition: `opacity ${animationDuration}ms`,
                        backgroundColor:
                            theme.name === "dark"
                                ? "rgba(0,0,0,0.6)"
                                : "rgba(0,0,0,0.4)",
                    }}
                    className={`fixed inset-0 ${open ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                    onClick={() => {
                        if (closeOnOverlayClick) onOpenChange(false);
                    }}
                />
            )}

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                    zIndex: zIndex + 1,
                    transition: `transform ${animationDuration}ms ease`,
                    transform: getTransform(),
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderLeft:
                        placement === "right"
                            ? `1px solid ${theme.colors.primaryBorder}`
                            : undefined,
                    borderRight:
                        placement === "left"
                            ? `1px solid ${theme.colors.primaryBorder}`
                            : undefined,
                    boxShadow:
                        theme.name === "dark"
                            ? "0 8px 32px rgba(0,0,0,0.6)"
                            : "0 8px 32px rgba(0,0,0,0.12)",

                    ...(placement === "right" && {
                        right: 0,
                        top: 0,
                        height: "100%",
                        width: isMobile ? "100%" : size,
                    }),
                    ...(placement === "left" && {
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: isMobile ? "100%" : size,
                    }),
                    ...(placement === "bottom" && {
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        height: size,
                    }),
                    ...(placement === "top" && {
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: size,
                    }),
                }}
                className="fixed"
            >
                {children}
            </div>
        </>
    );

    return ReactDOM.createPortal(drawer, document.body);
};




//usage

// const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   <div>
//                 <button
//                     onClick={() => setIsDrawerOpen(true)}
//                     className="px-4 py-2 bg-blue-600 text-white rounded"
//                 >
//                     Open Drawer
//                 </button>

//                 <Drawer
//                     open={isDrawerOpen}
//                     onOpenChange={setIsDrawerOpen}
//                     placement="left"
//                     size={400}
//                 >
//                     <div className="p-6">
//                         <h2 className="text-lg font-semibold mb-4">
//                             Settings Panel
//                         </h2>

//                         <p>This is drawer content.</p>

//                         <button
//                             onClick={() => setIsDrawerOpen(false)}
//                             className="mt-4 px-3 py-2 bg-red-500 text-white rounded"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </Drawer>
//             </div>
