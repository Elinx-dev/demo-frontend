import { useTheme } from "@/ui/theme/ThemeContext";
import React, {
    useEffect,
    useCallback,
    useRef,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import { useSRAnnounce } from "@/app/ScreenReaderProvider";

type CloseReason = "escape" | "overlay" | "button";

interface ModalProps {
    isOpen: boolean;
    onClose: (reason: CloseReason) => void;

    size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "full";
    closeOnOverlayClick?: boolean;
    closeOnEsc?: boolean;
    disableClose?: boolean;

    zIndex?: number;
    animationDuration?: number;

    showCloseButton?: boolean;
    preventScroll?: boolean;
    title?: string;

    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

//  Stable unique id for aria-labelledby 
let _modalCount = 0;

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    size = "md",
    closeOnOverlayClick = true,
    closeOnEsc = true,
    disableClose = false,
    zIndex = 1000,
    animationDuration = 200,
    showCloseButton = true,
    preventScroll = true,
    title,
    children,
    headerActions
}) => {
    const { theme } = useTheme();
    const modalRef = useRef<HTMLDivElement>(null);
    const announce = useSRAnnounce();
    // ── a11y: stable id so aria-labelledby always matches the <h2> ──
    const titleId = useRef(`modal-title-${++_modalCount}`).current;

    // ── a11y: remember what triggered the modal so we can restore focus ──
    const triggerRef = useRef<Element | null>(null);

    const handleClose = (reason: CloseReason) => {
        if (disableClose) return;
        announce("Dialog closed");
        onClose(reason);
    };

    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && closeOnEsc) {
                handleClose("escape");
            }
        },
        [closeOnEsc]
    );

    /* ----------------------------- */
    /* Scroll Lock + ESC              */
    /* ----------------------------- */

    useEffect(() => {
        if (isOpen && preventScroll) {
            document.body.style.overflow = "hidden";
            document.addEventListener("keydown", handleEscape);
        }
        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);
    useEffect(() => {
        if (isOpen) {
            announce(title ? `${title} dialog opened` : "Dialog opened");
        }
    }, [isOpen]);
    /* ----------------------------- */
    /* Focus Trap + Focus Restore     */
    /* ----------------------------- */

    useEffect(() => {
        if (!isOpen) return;

        // ── a11y: save the element that opened the modal ──
        triggerRef.current = document.activeElement;

        // ── a11y: broader selector catches custom components with tabIndex ──
        const getFocusable = () =>
            Array.from(
                modalRef.current?.querySelectorAll<HTMLElement>(
                    'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
                ) ?? []
            );

        // Move focus into modal - prefer close button, then first focusable
        const focusable = getFocusable();
        focusable[0]?.focus();

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            // Re-query on each tab in case modal content changes dynamically
            const current = getFocusable();
            if (!current.length) return;

            const first = current[0];
            const last = current[current.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleTab);

        return () => {
            document.removeEventListener("keydown", handleTab);
            // ── a11y: restore focus to trigger element on close ──
            if (triggerRef.current && "focus" in triggerRef.current) {
                (triggerRef.current as HTMLElement).focus();
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;
    const descriptionId = `${titleId}-desc`;
    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex }}
            role="dialog"
            aria-modal="true"
            // ── a11y: only set aria-labelledby when title exists ──
            // screen reader announces title text the moment modal opens
            aria-labelledby={title ? titleId : undefined}
            // ── a11y: if no title, at least describe the dialog ──
            aria-label={!title ? "Dialog" : undefined}
            aria-describedby={descriptionId}
        >
            {/* Overlay - decorative, hidden from SR */}
            <div
                aria-hidden="true"
                className="absolute inset-0 transition-opacity"
                style={{
                    backgroundColor:
                        theme.name === "dark"
                            ? "rgba(0,0,0,0.65)"
                            : "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(4px)",
                    animation: `fadeIn ${animationDuration}ms ease`,
                }}
                onClick={() => closeOnOverlayClick && handleClose("overlay")}
            />

            {/* Modal Box */}
            <div
                ref={modalRef}
                className={`relative rounded-xl max-h-[90vh] overflow-auto transition-all
                    ${size === "sm" ? "w-full max-w-sm" : ""}
                    ${size === "md" ? "w-full max-w-md" : ""}
                    ${size === "lg" ? "w-full max-w-lg" : ""}
                    ${size === "xl" ? "w-full max-w-xl" : ""}
                    ${size === "2xl" ? "w-full max-w-2xl" : ""}
                    ${size === "3xl" ? "w-full max-w-3xl" : ""}
                    ${size === "4xl" ? "w-full max-w-4xl" : ""}
                    ${size === "5xl" ? "w-full max-w-5xl" : ""}
                    ${size === "6xl" ? "w-full max-w-6xl" : ""}
                    ${size === "full" ? "w-full h-full rounded-none" : ""}
                `}
                style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.primaryBorder}`,
                    boxShadow:
                        theme.name === "dark"
                            ? "0 20px 60px rgba(0,0,0,0.7)"
                            : "0 20px 60px rgba(0,0,0,0.15)",
                    animation: `scaleIn ${animationDuration}ms ease`,
                }}
                id={descriptionId}
            >
                {/* ── a11y: render title as h2 with the id aria-labelledby points to ──
                    Visually hidden if caller doesn't want a visible title header,
                    but always present so SR announces it on open.               */}
                {(title || showCloseButton) && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px",
                        borderBottom: `1px solid ${theme.colors.primaryBorder}`,
                    }}>
                        {/* Title */}
                        {title && (
                            <h2
                                id={titleId}
                                style={{
                                    margin: 0, fontSize: 16, fontWeight: 600,
                                    color: theme.colors.text, lineHeight: 1.4,
                                }}
                            >
                                {title}
                            </h2>
                        )}

                        {/* Right side: headerActions + close button */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                            {headerActions}

                            {showCloseButton && !disableClose && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleClose("button")}
                                    aria-label="Close modal"
                                >
                                    <span aria-hidden="true">✕</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {children}
            </div>
        </div>,
        document.body
    );
};

// usage
//   const [open, setOpen] = useState(false);
//  <Button onClick={() => setOpen(true)}>
//         Open Modal
//       </Button>

//       <Modal
//         isOpen={open}
//         onClose={() => setOpen(false)}
//         title="Basic Modal"       ← SR announces "Basic Modal, dialog" on open
//       >
//         <p>This is a simple modal content.</p>
//         <div className="flex justify-end gap-2 mt-6">
//           <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
//           <Button onClick={() => setOpen(false)}>Confirm</Button>
//         </div>
//       </Modal>