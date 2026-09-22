import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Cols =
    | 1 | 2 | 3 | 4 | 5 | 6
    | "auto-fill" | "auto-fit"; // responsive auto-column modes

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

type Align = "start" | "center" | "end" | "stretch";
type Justify = "start" | "center" | "end" | "stretch";

type Breakpoint = {
    cols?: Cols;
    gap?: Gap;
};

// ─── Grid (Container) Props ───────────────────────────────────────────────────

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
    /** Number of columns - or "auto-fill" / "auto-fit" for responsive auto layout */
    cols?: Cols;
    /** Gap between cells */
    gap?: Gap;
    /** Min column width when using auto-fill / auto-fit (e.g. "200px", "12rem") */
    minColWidth?: string;
    /** Vertical alignment of all items within row tracks */
    align?: Align;
    /** Horizontal justification of all items within column tracks */
    justify?: Justify;
    /** Responsive breakpoints - each overrides cols & gap at that breakpoint */
    responsive?: {
        sm?: Breakpoint;
        md?: Breakpoint;
        lg?: Breakpoint;
        xl?: Breakpoint;
    };
    /** Apply a subtle themed background + border to the grid container */
    surface?: boolean;
    /** Inner padding of the grid container */
    padding?: Gap;
    children: ReactNode;
}

// ─── GridItem Props ───────────────────────────────────────────────────────────

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
    /** How many columns this item spans */
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
    /** How many rows this item spans */
    rowSpan?: 1 | 2 | 3 | 4;
    /** Override vertical alignment for this single cell */
    align?: Align;
    /** Override horizontal justification for this single cell */
    justify?: Justify;
    /** Apply a themed card surface to this item */
    surface?: boolean;
    children: ReactNode;
}

// ─── Value Maps ───────────────────────────────────────────────────────────────

const gapMap: Record<Gap, string> = {
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
};

const paddingMap: Record<Gap, string> = {
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
};

// Tailwind class maps - string literals so Tailwind's JIT never purges them
const fixedColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
};

const bpColsClass: Record<string, Record<number, string>> = {
    sm: { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5", 6: "sm:grid-cols-6" },
    md: { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" },
    lg: { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" },
    xl: { 1: "xl:grid-cols-1", 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-6" },
};

const bpGapClass: Record<string, Record<Gap, string>> = {
    sm: { none: "sm:gap-0", xs: "sm:gap-1", sm: "sm:gap-2", md: "sm:gap-4", lg: "sm:gap-6", xl: "sm:gap-8" },
    md: { none: "md:gap-0", xs: "md:gap-1", sm: "md:gap-2", md: "md:gap-4", lg: "md:gap-6", xl: "md:gap-8" },
    lg: { none: "lg:gap-0", xs: "lg:gap-1", sm: "lg:gap-2", md: "lg:gap-4", lg: "lg:gap-6", xl: "lg:gap-8" },
    xl: { none: "xl:gap-0", xs: "xl:gap-1", sm: "xl:gap-2", md: "xl:gap-4", lg: "xl:gap-6", xl: "xl:gap-8" },
};

const alignItemsMap: Record<Align, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
};

const justifyItemsMap: Record<Justify, string> = {
    start: "justify-items-start",
    center: "justify-items-center",
    end: "justify-items-end",
    stretch: "justify-items-stretch",
};

const alignSelfMap: Record<Align, string> = {
    start: "self-start",
    center: "self-center",
    end: "self-end",
    stretch: "self-stretch",
};

const justifySelfMap: Record<Justify, string> = {
    start: "justify-self-start",
    center: "justify-self-center",
    end: "justify-self-end",
    stretch: "justify-self-stretch",
};

const colSpanMap: Record<NonNullable<GridItemProps["colSpan"]>, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    full: "col-span-full",
};

const rowSpanMap: Record<NonNullable<GridItemProps["rowSpan"]>, string> = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveGridTemplateColumns(cols: Cols, minColWidth: string): string {
    if (cols === "auto-fill") return `repeat(auto-fill, minmax(${minColWidth}, 1fr))`;
    if (cols === "auto-fit") return `repeat(auto-fit, minmax(${minColWidth}, 1fr))`;
    return `repeat(${cols}, minmax(0, 1fr))`;
}

function buildResponsiveClasses(responsive: GridProps["responsive"]): string {
    if (!responsive) return "";
    const classes: string[] = [];

    (["sm", "md", "lg", "xl"] as const).forEach((bp) => {
        const cfg = responsive[bp];
        if (!cfg) return;
        if (cfg.cols && typeof cfg.cols === "number") {
            const cls = bpColsClass[bp][cfg.cols];
            if (cls) classes.push(cls);
        }
        if (cfg.gap) {
            classes.push(bpGapClass[bp][cfg.gap]);
        }
    });

    return classes.join(" ");
}

function cx(...parts: (string | undefined | false)[]): string {
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export const Grid = ({
    cols = 1,
    gap = "md",
    minColWidth = "200px",
    align = "stretch",
    justify = "stretch",
    responsive,
    surface = false,
    padding = "none",
    className = "",
    style,
    children,
    ...rest
}: GridProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const isAutoMode = cols === "auto-fill" || cols === "auto-fit";

    const gridStyle: CSSProperties = {
        display: "grid",
        gap: gapMap[gap],
        padding: paddingMap[padding],
        // For auto modes: inline style handles gridTemplateColumns
        // For fixed cols: Tailwind class handles it (so responsive bp overrides work)
        ...(isAutoMode && {
            gridTemplateColumns: resolveGridTemplateColumns(cols, minColWidth),
        }),
        ...(surface && {
            backgroundColor: c.primaryLight ?? "#f9fafb",
            border: `1px solid ${c.primaryBorder}`,
            borderRadius: "12px",
        }),
        ...style,
    };

    return (
        <div
            {...rest}
            style={gridStyle}
            className={cx(
                !isAutoMode && typeof cols === "number" && fixedColsClass[cols],
                alignItemsMap[align],
                justifyItemsMap[justify],
                buildResponsiveClasses(responsive),
                className
            )}
        >
            {children}
        </div>
    );
};

// ─── GridItem ──────────────────────────────────────────────────────────────----

export const GridItem = ({
    colSpan,
    rowSpan,
    align,
    justify,
    surface = false,
    className = "",
    style,
    children,
    ...rest
}: GridItemProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const itemStyle: CSSProperties = {
        ...(surface && {
            backgroundColor: "#ffffff",
            border: `1px solid ${c.primaryBorder}`,
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        }),
        ...style,
    };

    return (
        <div
            {...rest}
            style={itemStyle}
            className={cx(
                colSpan ? colSpanMap[colSpan] : "",
                rowSpan ? rowSpanMap[rowSpan] : "",
                align ? alignSelfMap[align] : "",
                justify ? justifySelfMap[justify] : "",
                className
            )}
        >
            {children}
        </div>
    );
};

// Basic 3-column grid
{/* <Grid cols={3} gap="lg">
    <GridItem>Card 1</GridItem>
    <GridItem>Card 2</GridItem>
    <GridItem>Card 3</GridItem>
</Grid> */}

// Responsive: 1 col mobile → 2 tablet → 4 desktop
{/* <Grid cols={1} gap="md" responsive={{ sm: { cols: 2 }, lg: { cols: 4 } }}>
    {items.map(item => <GridItem key={item.id}>{item.name}</GridItem>)}
</Grid> */}

// Auto-fill (truly fluid - no JS needed)
{/* <Grid cols="auto-fill" minColWidth="240px" gap="md">
    {cards.map(c => <GridItem key={c.id} surface>{c.title}</GridItem>)}
</Grid> */}

// Spanning - sidebar layout
{/* <Grid cols={4} gap="lg">
    <GridItem colSpan="full">Header</GridItem>
    <GridItem colSpan={1}>Sidebar</GridItem>
    <GridItem colSpan={3}>Main content</GridItem>
    <GridItem colSpan={2}>Footer left</GridItem>
    <GridItem colSpan={2}>Footer right</GridItem>
</Grid> */}

// Themed surfaces
{/* <Grid cols={2} gap="lg" surface padding="lg">
    <GridItem surface align="center">Centered card</GridItem>
    <GridItem surface>Normal card</GridItem>
</Grid> */}