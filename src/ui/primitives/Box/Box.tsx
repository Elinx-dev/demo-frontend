import type {
    CSSProperties,
    HTMLAttributes,
    ElementType,
    ReactNode,
} from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Spacing = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type Radius = "none" | "sm" | "md" | "lg" | "xl" | "full";
type Shadow = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Border = "none" | "xs" | "sm" | "md";
type Overflow = "visible" | "hidden" | "scroll" | "auto" | "clip";
type Display = "block" | "inline-block" | "inline" | "flex" | "inline-flex" | "grid" | "none";
type Position = "static" | "relative" | "absolute" | "fixed" | "sticky";
type Cursor = "default" | "pointer" | "not-allowed" | "grab" | "text" | "crosshair";
type Variant =
    | "surface"       // themed panel - bg + border
    | "card"          // white card + border + shadow
    | "ghost"         // transparent, no border
    | "filled"        // solid primary color fill
    | "danger"        // danger tinted surface
    | "success"       // success tinted surface
    | "none";         // unstyled - user controls everything

// ─── Box Props ────────────────────────────────────────────────────────────────

export interface BoxProps extends HTMLAttributes<HTMLElement> {
    /** Semantic HTML element to render as. Defaults to "div". */
    as?: ElementType;

    // ── Spacing ──────────────────────────────────────────────────────────────
    /** Padding on all sides */
    p?: Spacing;
    /** Padding horizontal (left + right) */
    px?: Spacing;
    /** Padding vertical (top + bottom) */
    py?: Spacing;
    /** Padding top */
    pt?: Spacing;
    /** Padding right */
    pr?: Spacing;
    /** Padding bottom */
    pb?: Spacing;
    /** Padding left */
    pl?: Spacing;

    /** Margin on all sides */
    m?: Spacing;
    /** Margin horizontal */
    mx?: Spacing;
    /** Margin vertical */
    my?: Spacing;
    /** Margin top */
    mt?: Spacing;
    /** Margin right */
    mr?: Spacing;
    /** Margin bottom */
    mb?: Spacing;
    /** Margin left */
    ml?: Spacing;

    // ── Sizing ───────────────────────────────────────────────────────────────
    /** Width shorthand - Tailwind class suffix, e.g. "full", "1/2", "64", "auto" */
    w?: string;
    /** Height shorthand */
    h?: string;
    /** Min width */
    minW?: string;
    /** Min height */
    minH?: string;
    /** Max width */
    maxW?: string;
    /** Max height */
    maxH?: string;

    // ── Visual ───────────────────────────────────────────────────────────────
    /** Preset visual style - theme-aware */
    variant?: Variant;
    /** Border radius */
    radius?: Radius;
    /** Box shadow */
    shadow?: Shadow;
    /** Border thickness */
    border?: Border;
    /** Custom border color override (CSS color string) */
    borderColor?: string;
    /** Background color override (CSS color string) */
    bg?: string;
    /** Text color override (CSS color string) */
    color?: string;
    /** Opacity - 0 to 100 */
    opacity?: number;

    // ── Layout ───────────────────────────────────────────────────────────────
    display?: Display;
    position?: Position;
    overflow?: Overflow;
    overflowX?: Overflow;
    overflowY?: Overflow;
    /** z-index value */
    zIndex?: number;

    // ── Interaction ──────────────────────────────────────────────────────────
    cursor?: Cursor;
    /** Pointer-events none */
    noEvents?: boolean;
    /** Hover elevation bump - adds shadow + slight lift on hover */
    hoverable?: boolean;
    /** Clickable - pointer cursor + hover scale */
    clickable?: boolean;

    // ── Misc ─────────────────────────────────────────────────────────────────
    /** Center children using flex */
    center?: boolean;
    /** Hide element visually (display:none) */
    hidden?: boolean;

    children?: ReactNode;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const spacingMap: Record<Spacing, string> = {
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
};

const radiusMap: Record<Radius, string> = {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
};

const shadowMap: Record<Shadow, string> = {
    none: "none",
    xs: "0 1px 2px rgba(0,0,0,0.05)",
    sm: "0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)",
    md: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
    lg: "0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)",
    xl: "0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)",
};

const borderWidthMap: Record<Border, string> = {
    none: "0px",
    xs: "1px",
    sm: "2px",
    md: "3px",
};

const overflowMap: Record<Overflow, string> = {
    visible: "visible",
    hidden: "hidden",
    scroll: "scroll",
    auto: "auto",
    clip: "clip",
};

const cursorMap: Record<Cursor, string> = {
    default: "default",
    pointer: "pointer",
    "not-allowed": "not-allowed",
    grab: "grab",
    text: "text",
    crosshair: "crosshair",
};

const positionMap: Record<Position, string> = {
    static: "static",
    relative: "relative",
    absolute: "absolute",
    fixed: "fixed",
    sticky: "sticky",
};

const displayMap: Record<Display, string> = {
    block: "block",
    "inline-block": "inline-block",
    inline: "inline",
    flex: "flex",
    "inline-flex": "inline-flex",
    grid: "grid",
    none: "none",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cx(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/** Resolve shorthand spacing (p overridden by axis, axis overridden by side) */
function resolveSpacing(
    all?: Spacing,
    x?: Spacing,
    y?: Spacing,
    top?: Spacing,
    right?: Spacing,
    bottom?: Spacing,
    left?: Spacing
): { top: string; right: string; bottom: string; left: string } {
    const base = all ? spacingMap[all] : "0px";
    const hBase = x ? spacingMap[x] : base;
    const vBase = y ? spacingMap[y] : base;
    return {
        top: top ? spacingMap[top] : vBase,
        right: right ? spacingMap[right] : hBase,
        bottom: bottom ? spacingMap[bottom] : vBase,
        left: left ? spacingMap[left] : hBase,
    };
}

// ─── Box Component ────────────────────────────────────────────────────────────

export const Box = ({
    as: Tag = "div",

    // Padding
    p, px, py, pt, pr, pb, pl,
    // Margin
    m, mx, my, mt, mr, mb, ml,

    // Sizing
    w, h, minW, minH, maxW, maxH,

    // Visual
    variant = "none",
    radius = "none",
    shadow = "none",
    border = "none",
    borderColor,
    bg,
    color,
    opacity,

    // Layout
    display,
    position,
    overflow,
    overflowX,
    overflowY,
    zIndex,

    // Interaction
    cursor,
    noEvents = false,
    hoverable = false,
    clickable = false,

    // Misc
    center = false,
    hidden = false,

    className = "",
    style,
    children,
    ...rest
}: BoxProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ── Spacing ──────────────────────────────────────────────────────────────
    const padding = resolveSpacing(p, px, py, pt, pr, pb, pl);
    const margin = resolveSpacing(m, mx, my, mt, mr, mb, ml);

    // ── Variant styles ────────────────────────────────────────────────────────
    const variantStyle: CSSProperties = (() => {
        switch (variant) {
            case "surface":
                return {
                    backgroundColor: c.primaryLight ?? "#f9fafb",
                    border: `1px solid ${c.primaryBorder}`,
                };
            case "card":
                return {
                    backgroundColor: "#ffffff",
                    border: `1px solid ${c.primaryBorder}`,
                    boxShadow: shadowMap["sm"],
                };
            case "filled":
                return {
                    background: `linear-gradient(135deg, ${c.primaryDark}, ${c.accent})`,
                    color: "#ffffff",
                };
            case "danger":
                return {
                    backgroundColor: "#fef2f2",
                    border: `1px solid ${c.danger}33`,
                    color: c.danger,
                };
            case "success":
                return {
                    backgroundColor: "#f0fdf4",
                    border: `1px solid ${c.success}33`,
                    color: c.success,
                };
            case "ghost":
            case "none":
            default:
                return {};
        }
    })();

    // ── Compose inline styles ─────────────────────────────────────────────────
    const boxStyle: CSSProperties = {
        // Padding
        paddingTop: padding.top,
        paddingRight: padding.right,
        paddingBottom: padding.bottom,
        paddingLeft: padding.left,

        // Margin
        marginTop: margin.top,
        marginRight: margin.right,
        marginBottom: margin.bottom,
        marginLeft: margin.left,

        // Sizing
        ...(w && { width: w.startsWith("--") ? `var(${w})` : w.includes("%") || w.includes("px") || w.includes("rem") ? w : undefined }),
        ...(h && { height: h.includes("%") || h.includes("px") || h.includes("rem") ? h : undefined }),
        ...(minW && { minWidth: minW }),
        ...(minH && { minHeight: minH }),
        ...(maxW && { maxWidth: maxW }),
        ...(maxH && { maxHeight: maxH }),

        // Visual
        borderRadius: radius !== "none" ? radiusMap[radius] : undefined,
        boxShadow: shadow !== "none" ? shadowMap[shadow] : undefined,
        borderWidth: border !== "none" ? borderWidthMap[border] : undefined,
        borderStyle: border !== "none" ? "solid" : undefined,
        ...(borderColor && { borderColor }),
        ...(bg && { backgroundColor: bg }),
        ...(color && { color }),
        ...(opacity !== undefined && { opacity: opacity / 100 }),

        // Layout
        ...(display && { display: displayMap[display] as CSSProperties["display"] }),
        ...(position && { position: positionMap[position] as CSSProperties["position"] }),
        ...(overflow && { overflow: overflowMap[overflow] as CSSProperties["overflow"] }),
        ...(overflowX && { overflowX: overflowMap[overflowX] as CSSProperties["overflowX"] }),
        ...(overflowY && { overflowY: overflowMap[overflowY] as CSSProperties["overflowY"] }),
        ...(zIndex !== undefined && { zIndex }),

        // Interaction
        ...(cursor && { cursor: cursorMap[cursor] as CSSProperties["cursor"] }),
        ...(noEvents && { pointerEvents: "none" as CSSProperties["pointerEvents"] }),

        // Visibility
        ...(hidden && { display: "none" }),

        // Center shortcut
        ...(center && {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }),

        // Spread variant styles last so variant wins over defaults
        ...variantStyle,

        // User style overrides everything
        ...style,
    };

    return (
        <Tag
            {...rest}
            style={boxStyle}
            className={cx(
                hoverable && "transition-shadow duration-200 hover:shadow-lg hover:-translate-y-0.5",
                clickable && "cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-95",
                className
            )}
        >
            {children}
        </Tag>
    );
};


// Simple padded card
{/* <Box variant="card" p="lg" radius="lg" shadow="md">
    <h2>Title</h2>
</Box> */}

// Polymorphic - renders as <section>
{/* <Box as="section" variant="surface" px="xl" py="lg" radius="md">
    <p>Content</p>
</Box> */}

// Centered hero area
{/* <Box center minH="100vh" bg="linear-gradient(135deg, #0f172a, #1e3a5f)">
    <h1 style={{ color: "#fff" }}>Hero</h1>
</Box> */}

// Danger alert box
{/* <Box variant="danger" p="md" radius="md" border="xs">
    Something went wrong.
</Box> */}

// Clickable thumbnail card
{/* <Box variant="card" radius="lg" shadow="sm" clickable hoverable onClick={handleClick}>
    <img src={thumb} alt="..." />
</Box> */}

// Absolute overlay
{/* <Box position="absolute" display="flex" zIndex={50} style={{ inset: 0 }} bg="rgba(0,0,0,0.4)" center>
    <Spinner />
</Box> */}

// Spacing cascade - pt overrides py which overrides p
{/* <Box p="lg" py="md" pt="xs">
    Fine-grained spacing control
</Box> */}