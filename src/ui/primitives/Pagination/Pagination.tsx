import {
    useState,
    useCallback,
    useMemo,
    type CSSProperties,
    type KeyboardEvent,
} from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "xs" | "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "outline" | "minimal" | "pill";
type Align = "left" | "center" | "right";

export interface PaginationProps {
    /** Total number of items */
    total: number;
    /** Items per page. Default: 10 */
    pageSize?: number;
    /** Current page (controlled, 1-based) */
    current?: number;
    /** Default page (uncontrolled, 1-based). Default: 1 */
    defaultCurrent?: number;
    /** Fires when page changes */
    onChange?: (page: number, pageSize: number) => void;
    /** Fires when page size changes */
    onPageSizeChange?: (pageSize: number) => void;
    /** Number of sibling pages to show around the current page. Default: 1 */
    siblings?: number;
    /** How many page buttons to show at boundaries (start/end). Default: 1 */
    boundaries?: number;
    /** Show prev / next buttons */
    showPrevNext?: boolean;
    /** Show first / last jump buttons */
    showFirstLast?: boolean;
    /** Show "Go to page" input */
    showJumper?: boolean;
    /** Show total count label */
    showTotal?: boolean;
    /** Custom total label renderer */
    totalRenderer?: (total: number, range: [number, number]) => string;
    /** Show page size selector */
    showPageSizeSelector?: boolean;
    /** Page size options */
    pageSizeOptions?: number[];
    /** Disable entire pagination */
    disabled?: boolean;
    /** Visual size */
    size?: Size;
    /** Visual style variant */
    variant?: Variant;
    /** Alignment inside the container */
    align?: Align;
    /** Show compact mode - hides labels, shrinks spacing */
    compact?: boolean;
    /** Simple mode - only shows prev/next with page X of Y */
    simple?: boolean;
    /** Accessible label */
    label?: string;
    className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { h: number; minW: number; font: number; gap: number; radius: number }> = {
    xs: { h: 24, minW: 24, font: 11, gap: 2, radius: 4 },
    sm: { h: 28, minW: 28, font: 12, gap: 3, radius: 6 },
    md: { h: 32, minW: 32, font: 13, gap: 4, radius: 8 },
    lg: { h: 40, minW: 40, font: 15, gap: 6, radius: 10 },
};

// ─── SVG Icons (inline, zero deps) ───────────────────────────────────────────

const ChevronLeft = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRight = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const ChevronsLeft = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="11 17 6 12 11 7" />
        <polyline points="18 17 13 12 18 7" />
    </svg>
);

const ChevronsRight = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
    </svg>
);

const Ellipsis = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
    </svg>
);

// ─── Page range builder ───────────────────────────────────────────────────────

function buildPageRange(
    current: number,
    total: number,
    siblings: number,
    boundaries: number
): (number | "ellipsis-start" | "ellipsis-end")[] {
    const totalButtons = siblings * 2 + boundaries * 2 + 3; // siblings + boundaries + current + 2 ellipsis

    // If all pages fit - no ellipsis needed
    if (total <= totalButtons) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const leftSibling = Math.max(current - siblings, boundaries + 1);
    const rightSibling = Math.min(current + siblings, total - boundaries);

    const showLeftEllipsis = leftSibling > boundaries + 2;
    const showRightEllipsis = rightSibling < total - boundaries - 1;

    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

    // Left boundary
    for (let i = 1; i <= boundaries; i++) pages.push(i);

    // Left ellipsis or fill
    if (showLeftEllipsis) {
        pages.push("ellipsis-start");
    } else {
        for (let i = boundaries + 1; i < leftSibling; i++) pages.push(i);
    }

    // Siblings + current
    for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);

    // Right ellipsis or fill
    if (showRightEllipsis) {
        pages.push("ellipsis-end");
    } else {
        for (let i = rightSibling + 1; i <= total - boundaries; i++) pages.push(i);
    }

    // Right boundary
    for (let i = total - boundaries + 1; i <= total; i++) pages.push(i);

    return pages;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// function cx(...parts: (string | undefined | false | null)[]): string {
//     return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
// }

function totalPages(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / pageSize));
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export const Pagination = ({
    total,
    pageSize: pageSizeProp = 10,
    current: currentProp,
    defaultCurrent = 1,
    onChange,
    onPageSizeChange,
    siblings = 1,
    boundaries = 1,
    showPrevNext = true,
    showFirstLast = false,
    showJumper = false,
    showTotal = false,
    totalRenderer,
    showPageSizeSelector = false,
    pageSizeOptions = [10, 20, 50, 100],
    disabled = false,
    size = "md",
    variant = "outline",
    align = "left",
    compact = false,
    simple = false,
    label = "Pagination",
    className = "",
}: PaginationProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ── State ─────────────────────────────────────────────────────────────────
    const isControlled = currentProp !== undefined;
    const [internalPage, setInternalPage] = useState(defaultCurrent);
    const [internalPageSize, setInternalPageSize] = useState(pageSizeProp);
    const [jumperVal, setJumperVal] = useState("");

    const activePage = isControlled ? (currentProp ?? 1) : internalPage;
    const activeSize = internalPageSize;
    const pages = totalPages(total, activeSize);

    // ── Navigate ──────────────────────────────────────────────────────────────
    const goTo = useCallback((page: number) => {
        const clamped = Math.min(Math.max(1, page), pages);
        if (clamped === activePage) return;
        if (!isControlled) setInternalPage(clamped);
        onChange?.(clamped, activeSize);
    }, [pages, activePage, isControlled, onChange, activeSize]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        const newPages = totalPages(total, newSize);
        const newPage = Math.min(activePage, newPages);
        setInternalPageSize(newSize);
        onPageSizeChange?.(newSize);
        if (!isControlled) setInternalPage(newPage);
        onChange?.(newPage, newSize);
    }, [total, activePage, isControlled, onChange, onPageSizeChange]);

    const handleJumper = useCallback(() => {
        const page = parseInt(jumperVal, 10);
        if (!isNaN(page)) goTo(page);
        setJumperVal("");
    }, [jumperVal, goTo]);

    const handleJumperKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleJumper();
    }, [handleJumper]);

    // ── Sizing ────────────────────────────────────────────────────────────────
    const { h, minW, font, gap, radius } = sizeMap[size];
    const iconSize = Math.round(font * 1.1);

    // ── Colors ────────────────────────────────────────────────────────────────
    const activeColor = c.accent ?? "#6366f1";
    const activeDark = c.primaryDark ?? "#4338ca";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = "#374151";
    const mutedColor = "#9ca3af";

    // ── Button style factory ──────────────────────────────────────────────────
    const btnStyle = useCallback((
        isActive = false,
        isDisabled = false,
        isGhost = false,
    ): CSSProperties => {
        const base: CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: h,
            minWidth: minW,
            padding: `0 ${Math.round(minW * 0.3)}px`,
            fontSize: font,
            fontWeight: isActive ? 700 : 500,
            borderRadius: variant === "pill" ? 9999 : radius,
            border: "none",
            outline: "none",
            cursor: isDisabled ? "not-allowed" : "pointer",
            opacity: isDisabled ? 0.4 : 1,
            transition: "all 0.15s ease",
            userSelect: "none",
            flexShrink: 0,
            lineHeight: 1,
            pointerEvents: isDisabled ? "none" : "auto",
        };

        if (isGhost) {
            return {
                ...base,
                background: "transparent",
                color: isDisabled ? mutedColor : textColor,
            };
        }

        switch (variant) {
            case "primary":
                return {
                    ...base,
                    background: isActive
                        ? `linear-gradient(135deg, ${activeDark}, ${activeColor})`
                        : "transparent",
                    color: isActive ? "#fff" : textColor,
                    boxShadow: isActive ? `0 2px 6px ${activeColor}44` : "none",
                };
            case "secondary":
                return {
                    ...base,
                    background: isActive ? activeColor + "1a" : "transparent",
                    color: isActive ? activeColor : textColor,
                    border: isActive ? `1.5px solid ${activeColor}` : `1.5px solid transparent`,
                };
            case "outline":
                return {
                    ...base,
                    background: isActive ? activeColor : "#fff",
                    color: isActive ? "#fff" : textColor,
                    border: `1px solid ${isActive ? activeColor : borderColor}`,
                    boxShadow: isActive ? `0 2px 4px ${activeColor}33` : "none",
                };
            case "minimal":
                return {
                    ...base,
                    background: "transparent",
                    color: isActive ? activeColor : textColor,
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: isActive ? "underline" : "none",
                    textUnderlineOffset: "3px",
                };
            case "pill":
                return {
                    ...base,
                    background: isActive
                        ? `linear-gradient(135deg, ${activeDark}, ${activeColor})`
                        : borderColor + "30",
                    color: isActive ? "#fff" : textColor,
                    boxShadow: isActive ? `0 2px 8px ${activeColor}44` : "none",
                    padding: `0 ${Math.round(minW * 0.5)}px`,
                };
            default:
                return base;
        }
    }, [h, minW, font, radius, variant, activeColor, activeDark, borderColor, textColor, mutedColor]);

    // ── Page range ────────────────────────────────────────────────────────────
    const pageRange = useMemo(
        () => buildPageRange(activePage, pages, siblings, boundaries),
        [activePage, pages, siblings, boundaries]
    );

    // ── Total label ───────────────────────────────────────────────────────────
    const rangeStart = Math.min((activePage - 1) * activeSize + 1, total);
    const rangeEnd = Math.min(activePage * activeSize, total);
    const totalLabel = totalRenderer
        ? totalRenderer(total, [rangeStart, rangeEnd])
        : `${rangeStart}–${rangeEnd} of ${total}`;

    // ── Align wrapper ─────────────────────────────────────────────────────────
    const alignMap: Record<Align, string> = {
        left: "flex-start",
        center: "center",
        right: "flex-end",
    };

    const wrapperStyle: CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: compact ? gap : gap * 1.5,
        justifyContent: alignMap[align],
        width: "100%",
    };

    const groupStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: gap,
    };

    // ── Simple mode ───────────────────────────────────────────────────────────
    if (simple) {
        return (
            <nav aria-label={label} className={className}>
                <div style={wrapperStyle}>
                    <button
                        style={btnStyle(false, activePage <= 1)}
                        onClick={() => goTo(activePage - 1)}
                        aria-label="Previous page"
                        disabled={activePage <= 1 || disabled}
                    >
                        <ChevronLeft size={iconSize} />
                    </button>

                    <span style={{ fontSize: font, color: textColor, fontWeight: 500, padding: `0 ${gap * 2}px` }}>
                        <span style={{ fontWeight: 700, color: activeColor }}>{activePage}</span>
                        <span style={{ color: mutedColor }}> / {pages}</span>
                    </span>

                    <button
                        style={btnStyle(false, activePage >= pages)}
                        onClick={() => goTo(activePage + 1)}
                        aria-label="Next page"
                        disabled={activePage >= pages || disabled}
                    >
                        <ChevronRight size={iconSize} />
                    </button>
                </div>
            </nav>
        );
    }

    // ── Full mode ─────────────────────────────────────────────────────────────
    return (
        <nav aria-label={label} className={className}>
            <div style={wrapperStyle}>

                {/* Total label */}
                {showTotal && !compact && (
                    <span style={{ fontSize: font, color: mutedColor, flexShrink: 0 }}>
                        {totalLabel}
                    </span>
                )}

                {/* Page size selector */}
                {showPageSizeSelector && !compact && (
                    <select
                        value={activeSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        disabled={disabled}
                        aria-label="Items per page"
                        style={{
                            height: h,
                            fontSize: font,
                            border: `1px solid ${borderColor}`,
                            borderRadius: radius,
                            padding: `0 ${gap}px`,
                            cursor: disabled ? "not-allowed" : "pointer",
                            color: textColor,
                            background: "#fff",
                            outline: "none",
                        }}
                    >
                        {pageSizeOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt} / page</option>
                        ))}
                    </select>
                )}

                {/* Main page buttons */}
                <div style={groupStyle} role="list">

                    {/* First page */}
                    {showFirstLast && (
                        <button
                            style={btnStyle(false, activePage <= 1 || disabled, true)}
                            onClick={() => goTo(1)}
                            aria-label="First page"
                            disabled={activePage <= 1 || disabled}
                            title="First page"
                        >
                            <ChevronsLeft size={iconSize} />
                        </button>
                    )}

                    {/* Prev */}
                    {showPrevNext && (
                        <button
                            style={btnStyle(false, activePage <= 1 || disabled, variant === "minimal")}
                            onClick={() => goTo(activePage - 1)}
                            aria-label="Previous page"
                            disabled={activePage <= 1 || disabled}
                        >
                            <ChevronLeft size={iconSize} />
                            {!compact && size !== "xs" && (
                                <span style={{ marginLeft: 3 }}>Prev</span>
                            )}
                        </button>
                    )}

                    {/* Page numbers */}
                    {pageRange.map((item, idx) => {
                        if (item === "ellipsis-start" || item === "ellipsis-end") {
                            return (
                                <span
                                    key={item}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: h,
                                        minWidth: minW,
                                        color: mutedColor,
                                        fontSize: font,
                                        cursor: "default",
                                        userSelect: "none",
                                    }}
                                    aria-hidden="true"
                                >
                                    <Ellipsis size={iconSize} />
                                </span>
                            );
                        }

                        const isActive = item === activePage;
                        return (
                            <button
                                key={`${item}-${idx}`}
                                role="listitem"
                                style={btnStyle(isActive, disabled)}
                                onClick={() => goTo(item)}
                                aria-label={`Page ${item}`}
                                aria-current={isActive ? "page" : undefined}
                                disabled={disabled}
                            >
                                {item}
                            </button>
                        );
                    })}

                    {/* Next */}
                    {showPrevNext && (
                        <button
                            style={btnStyle(false, activePage >= pages || disabled, variant === "minimal")}
                            onClick={() => goTo(activePage + 1)}
                            aria-label="Next page"
                            disabled={activePage >= pages || disabled}
                        >
                            {!compact && size !== "xs" && (
                                <span style={{ marginRight: 3 }}>Next</span>
                            )}
                            <ChevronRight size={iconSize} />
                        </button>
                    )}

                    {/* Last page */}
                    {showFirstLast && (
                        <button
                            style={btnStyle(false, activePage >= pages || disabled, true)}
                            onClick={() => goTo(pages)}
                            aria-label="Last page"
                            disabled={activePage >= pages || disabled}
                            title="Last page"
                        >
                            <ChevronsRight size={iconSize} />
                        </button>
                    )}
                </div>

                {/* Go to page jumper */}
                {showJumper && !compact && (
                    <div style={{ display: "flex", alignItems: "center", gap }}>
                        <span style={{ fontSize: font, color: mutedColor, whiteSpace: "nowrap" }}>
                            Go to
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={pages}
                            value={jumperVal}
                            onChange={(e) => setJumperVal(e.target.value)}
                            onKeyDown={handleJumperKey}
                            onBlur={handleJumper}
                            disabled={disabled}
                            aria-label="Go to page"
                            style={{
                                height: h,
                                width: minW * 2,
                                fontSize: font,
                                border: `1px solid ${borderColor}`,
                                borderRadius: radius,
                                padding: `0 ${gap}px`,
                                textAlign: "center",
                                color: textColor,
                                outline: "none",
                                background: disabled ? "#f9fafb" : "#fff",
                                cursor: disabled ? "not-allowed" : "text",
                            }}
                        />
                        <span style={{ fontSize: font, color: mutedColor }}>
                            / {pages}
                        </span>
                    </div>
                )}

            </div>
        </nav>
    );
};

//Example usage:
// Basic
{/* <Pagination total={230} onChange={(page) => setPage(page)} /> */ }

// Full-featured
{/* <Pagination
    total={500}
    current={page}
    pageSize={20}
    onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
    showPrevNext
    showFirstLast
    showJumper
    showTotal
    showPageSizeSelector
    siblings={2}
    boundaries={1}
    variant="outline"
    size="md"
/> */}

// Pill style, centered
{/* <Pagination total={100} variant="pill" align="center" size="lg" /> */ }

// Simple mode
{/* <Pagination total={200} simple size="sm" /> */ }

// Compact for tight spaces
{/* <Pagination total={300} compact size="xs" /> */ }

// Custom total label
{/* <Pagination
    total={450}
    showTotal
    totalRenderer={(total, [s, e]) => `Showing ${s} to ${e} of ${total} results`}
/> */}

// Controlled
{/* <Pagination
    total={200}
    current={currentPage}
    onChange={(page) => setCurrentPage(page)}
    variant="primary"
    align="right"
/> */}