import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = "row" | "row-reverse" | "col" | "col-reverse";
type Wrap = "wrap" | "nowrap" | "wrap-reverse";
type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify =
    | "start"
    | "center"
    | "end"
    | "between"
    | "around"
    | "evenly"
    | "stretch";

type Breakpoint = {
    direction?: Direction;
    wrap?: Wrap;
    gap?: Gap;
    align?: Align;
    justify?: Justify;
};

// ─── Flex (Container) Props ───────────────────────────────────────────────────

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
    /** Main axis direction */
    direction?: Direction;
    /** Wrapping behaviour */
    wrap?: Wrap;
    /** Gap between children (row & column) */
    gap?: Gap;
    /** Gap only on the row axis */
    gapX?: Gap;
    /** Gap only on the column axis */
    gapY?: Gap;
    /** Cross-axis alignment (align-items) */
    align?: Align;
    /** Main-axis justification (justify-content) */
    justify?: Justify;
    /** Stretch container to full width */
    fullWidth?: boolean;
    /** Stretch container to full height */
    fullHeight?: boolean;
    /** Render as inline-flex */
    inline?: boolean;
    /** Apply themed surface (background + border) */
    surface?: boolean;
    /** Inner padding using Gap scale */
    padding?: Gap;
    /** Responsive overrides per breakpoint */
    responsive?: {
        sm?: Breakpoint;
        md?: Breakpoint;
        lg?: Breakpoint;
        xl?: Breakpoint;
    };
    children: ReactNode;
}

// ─── FlexItem Props ───────────────────────────────────────────────────────────

export interface FlexItemProps extends HTMLAttributes<HTMLDivElement> {
    /** flex-grow value */
    grow?: 0 | 1;
    /** flex-shrink value */
    shrink?: 0 | 1;
    /** flex-basis shorthand */
    basis?: "auto" | "full" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4";
    /** Self cross-axis alignment override */
    align?: Align;
    /** Order override */
    order?: -1 | 0 | 1 | 2 | 3 | 4 | 5 | "first" | "last";
    /** Apply themed card surface to this item */
    surface?: boolean;
    children: ReactNode;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

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

// Tailwind class maps (string literals - safe from JIT purging)
const directionClass: Record<Direction, string> = {
    "row": "flex-row",
    "row-reverse": "flex-row-reverse",
    "col": "flex-col",
    "col-reverse": "flex-col-reverse",
};

const wrapClass: Record<Wrap, string> = {
    "wrap": "flex-wrap",
    "nowrap": "flex-nowrap",
    "wrap-reverse": "flex-wrap-reverse",
};

const alignItemsClass: Record<Align, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
};

const justifyContentClass: Record<Justify, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
    stretch: "justify-stretch",
};

const alignSelfClass: Record<Align, string> = {
    start: "self-start",
    center: "self-center",
    end: "self-end",
    stretch: "self-stretch",
    baseline: "self-baseline",
};

const growClass: Record<0 | 1, string> = { 0: "grow-0", 1: "grow" };
const shrinkClass: Record<0 | 1, string> = { 0: "shrink-0", 1: "shrink" };

const basisClass: Record<NonNullable<FlexItemProps["basis"]>, string> = {
    auto: "basis-auto",
    full: "basis-full",
    "1/2": "basis-1/2",
    "1/3": "basis-1/3",
    "2/3": "basis-2/3",
    "1/4": "basis-1/4",
    "3/4": "basis-3/4",
};

const orderClass: Record<
    NonNullable<FlexItemProps["order"]>,
    string
> = {
    "-1": "-order-1",
    0: "order-none",
    1: "order-1",
    2: "order-2",
    3: "order-3",
    4: "order-4",
    5: "order-5",
    first: "order-first",
    last: "order-last",
};

// Responsive Tailwind prefix maps
const bpDirectionClass: Record<string, Record<Direction, string>> = {
    sm: { "row": "sm:flex-row", "row-reverse": "sm:flex-row-reverse", "col": "sm:flex-col", "col-reverse": "sm:flex-col-reverse" },
    md: { "row": "md:flex-row", "row-reverse": "md:flex-row-reverse", "col": "md:flex-col", "col-reverse": "md:flex-col-reverse" },
    lg: { "row": "lg:flex-row", "row-reverse": "lg:flex-row-reverse", "col": "lg:flex-col", "col-reverse": "lg:flex-col-reverse" },
    xl: { "row": "xl:flex-row", "row-reverse": "xl:flex-row-reverse", "col": "xl:flex-col", "col-reverse": "xl:flex-col-reverse" },
};

const bpWrapClass: Record<string, Record<Wrap, string>> = {
    sm: { "wrap": "sm:flex-wrap", "nowrap": "sm:flex-nowrap", "wrap-reverse": "sm:flex-wrap-reverse" },
    md: { "wrap": "md:flex-wrap", "nowrap": "md:flex-nowrap", "wrap-reverse": "md:flex-wrap-reverse" },
    lg: { "wrap": "lg:flex-wrap", "nowrap": "lg:flex-nowrap", "wrap-reverse": "lg:flex-wrap-reverse" },
    xl: { "wrap": "xl:flex-wrap", "nowrap": "xl:flex-nowrap", "wrap-reverse": "xl:flex-wrap-reverse" },
};

const bpGapClass: Record<string, Record<Gap, string>> = {
    sm: { none: "sm:gap-0", xs: "sm:gap-1", sm: "sm:gap-2", md: "sm:gap-4", lg: "sm:gap-6", xl: "sm:gap-8" },
    md: { none: "md:gap-0", xs: "md:gap-1", sm: "md:gap-2", md: "md:gap-4", lg: "md:gap-6", xl: "md:gap-8" },
    lg: { none: "lg:gap-0", xs: "lg:gap-1", sm: "lg:gap-2", md: "lg:gap-4", lg: "lg:gap-6", xl: "lg:gap-8" },
    xl: { none: "xl:gap-0", xs: "xl:gap-1", sm: "xl:gap-2", md: "xl:gap-4", lg: "xl:gap-6", xl: "xl:gap-8" },
};

const bpAlignClass: Record<string, Record<Align, string>> = {
    sm: { start: "sm:items-start", center: "sm:items-center", end: "sm:items-end", stretch: "sm:items-stretch", baseline: "sm:items-baseline" },
    md: { start: "md:items-start", center: "md:items-center", end: "md:items-end", stretch: "md:items-stretch", baseline: "md:items-baseline" },
    lg: { start: "lg:items-start", center: "lg:items-center", end: "lg:items-end", stretch: "lg:items-stretch", baseline: "lg:items-baseline" },
    xl: { start: "xl:items-start", center: "xl:items-center", end: "xl:items-end", stretch: "xl:items-stretch", baseline: "xl:items-baseline" },
};

const bpJustifyClass: Record<string, Record<Justify, string>> = {
    sm: { start: "sm:justify-start", center: "sm:justify-center", end: "sm:justify-end", between: "sm:justify-between", around: "sm:justify-around", evenly: "sm:justify-evenly", stretch: "sm:justify-stretch" },
    md: { start: "md:justify-start", center: "md:justify-center", end: "md:justify-end", between: "md:justify-between", around: "md:justify-around", evenly: "md:justify-evenly", stretch: "md:justify-stretch" },
    lg: { start: "lg:justify-start", center: "lg:justify-center", end: "lg:justify-end", between: "lg:justify-between", around: "lg:justify-around", evenly: "lg:justify-evenly", stretch: "lg:justify-stretch" },
    xl: { start: "xl:justify-start", center: "xl:justify-center", end: "xl:justify-end", between: "xl:justify-between", around: "xl:justify-around", evenly: "xl:justify-evenly", stretch: "xl:justify-stretch" },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function cx(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function buildResponsiveClasses(responsive: FlexProps["responsive"]): string {
    if (!responsive) return "";
    const classes: string[] = [];

    (["sm", "md", "lg", "xl"] as const).forEach((bp) => {
        const cfg = responsive[bp];
        if (!cfg) return;
        if (cfg.direction) classes.push(bpDirectionClass[bp][cfg.direction]);
        if (cfg.wrap) classes.push(bpWrapClass[bp][cfg.wrap]);
        if (cfg.gap) classes.push(bpGapClass[bp][cfg.gap]);
        if (cfg.align) classes.push(bpAlignClass[bp][cfg.align]);
        if (cfg.justify) classes.push(bpJustifyClass[bp][cfg.justify]);
    });

    return classes.join(" ");
}

// ─── Flex Component ───────────────────────────────────────────────────────────

export const Flex = ({
    direction = "row",
    wrap = "nowrap",
    gap,
    gapX,
    gapY,
    align = "stretch",
    justify = "start",
    fullWidth = false,
    fullHeight = false,
    inline = false,
    surface = false,
    padding = "none",
    responsive,
    className = "",
    style,
    children,
    ...rest
}: FlexProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // Gap: gapX / gapY override the unified gap if provided
    const resolvedGapStyle: CSSProperties = {
        ...(gap && !gapX && !gapY && { gap: gapMap[gap] }),
        ...(gapX && { columnGap: gapMap[gapX] }),
        ...(gapY && { rowGap: gapMap[gapY] }),
    };

    const containerStyle: CSSProperties = {
        display: inline ? "inline-flex" : "flex",
        padding: paddingMap[padding],
        ...resolvedGapStyle,
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
            style={containerStyle}
            className={cx(
                directionClass[direction],
                wrapClass[wrap],
                alignItemsClass[align],
                justifyContentClass[justify],
                fullWidth && "w-full",
                fullHeight && "h-full",
                buildResponsiveClasses(responsive),
                className
            )}
        >
            {children}
        </div>
    );
};

// ─── FlexItem Component ───────────────────────────────────────────────────────

export const FlexItem = ({
    grow,
    shrink,
    basis,
    align,
    order,
    surface = false,
    className = "",
    style,
    children,
    ...rest
}: FlexItemProps) => {
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
                grow !== undefined && growClass[grow],
                shrink !== undefined && shrinkClass[shrink],
                basis && basisClass[basis],
                align && alignSelfClass[align],
                order !== undefined && orderClass[order],
                className
            )}
        >
            {children}
        </div>
    );
};


// Navbar layout - space between, vertically centered
{/* <Flex justify="between" align="center" fullWidth padding="md">
    <FlexItem><Logo /></FlexItem>
    <FlexItem grow={1}><NavLinks /></FlexItem>
    <FlexItem><Button>Login</Button></FlexItem>
</Flex> */}

// Responsive: stacked on mobile → row on tablet+
{/* <Flex direction="col" gap="md" responsive={{ md: { direction: "row", gap: "lg" } }}>
    <FlexItem basis="1/3" surface><Sidebar /></FlexItem>
    <FlexItem grow={1} surface><Main /></FlexItem>
</Flex> */}

// Centered hero section
{/* <Flex direction="col" align="center" justify="center" fullWidth fullHeight gap="lg">
    <h1>Hello World</h1>
    <Button>Get Started</Button>
</Flex> */}

// Tag list with wrap
{/* <Flex wrap="wrap" gap="sm">
    {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
</Flex> */}

// Different column/row gaps
{/* <Flex wrap="wrap" gapX="lg" gapY="sm">
    {items.map(i => <FlexItem key={i.id} basis="1/2">{i.name}</FlexItem>)}
</Flex> */}

// Reordering items
{/* <Flex direction="row">
    <FlexItem order="last">I appear last</FlexItem>
    <FlexItem order="first">I appear first</FlexItem>
    <FlexItem>I stay in the middle</FlexItem>
</Flex> */}