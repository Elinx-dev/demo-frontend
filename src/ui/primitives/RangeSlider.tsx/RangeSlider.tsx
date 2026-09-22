import {
    useState,
    useRef,
    useCallback,
    useEffect,
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "xs" | "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning" | "custom";
type Marks = boolean | { value: number; label?: string }[];

export interface RangeSliderProps {
    /** Minimum value. Default: 0 */
    min?: number;
    /** Maximum value. Default: 100 */
    max?: number;
    /** Step size. Default: 1 */
    step?: number;
    /** Single value (controlled) */
    value?: number;
    /** Range value [min, max] (controlled) - enables dual-thumb mode */
    rangeValue?: [number, number];
    /** Default single value (uncontrolled) */
    defaultValue?: number;
    /** Default range value (uncontrolled) */
    defaultRangeValue?: [number, number];
    /** Fires on single value change */
    onChange?: (value: number) => void;
    /** Fires on range value change */
    onRangeChange?: (value: [number, number]) => void;
    /** Fires when user finishes dragging */
    onAfterChange?: (value: number | [number, number]) => void;
    /** Enable dual-thumb range mode */
    range?: boolean;
    /** Track thickness */
    size?: Size;
    /** Color preset */
    variant?: Variant;
    /** Custom track active color (overrides variant) */
    trackColor?: string;
    /** Custom thumb color */
    thumbColor?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Show tick marks. Pass true for auto marks at each step, or an array for custom */
    marks?: Marks;
    /** Show tooltip above thumb while dragging */
    tooltip?: boolean;
    /** Always show tooltip (not just on drag) */
    tooltipAlways?: boolean;
    /** Custom tooltip formatter */
    tooltipFormatter?: (value: number) => string;
    /** Show min/max labels at the ends */
    showEndLabels?: boolean;
    /** Show current value label above the track */
    showValue?: boolean;
    /** Reverse the track direction */
    reverse?: boolean;
    /** Vertical orientation */
    vertical?: boolean;
    /** Height when vertical (CSS string) */
    verticalHeight?: string;
    /** Accessible label */
    label?: string;
    className?: string;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const trackHeightMap: Record<Size, number> = {
    xs: 3,
    sm: 4,
    md: 6,
    lg: 8,
};

const thumbSizeMap: Record<Size, number> = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 22,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

function snapToStep(val: number, min: number, step: number): number {
    return Math.round((val - min) / step) * step + min;
}

function toPercent(val: number, min: number, max: number): number {
    return ((val - min) / (max - min)) * 100;
}

function cx(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const Thumb = ({
    percent,
    value,
    size,
    thumbColor,
    trackColor,
    disabled,
    tooltip,
    tooltipAlways,
    tooltipFormatter,
    vertical,
    reverse,
    onPointerDown,
    onKeyDown,
    ariaLabel,
    ariaMin,
    ariaMax,
    ariaValue,
    tabIndex = 0,
    zIndex = 2,
}: {
    percent: number;
    value: number;
    size: Size;
    thumbColor: string;
    trackColor: string;
    disabled: boolean;
    tooltip: boolean;
    tooltipAlways: boolean;
    tooltipFormatter?: (v: number) => string;
    vertical: boolean;
    reverse: boolean;
    onPointerDown: (e: ReactPointerEvent<HTMLSpanElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => void;
    ariaLabel: string;
    ariaMin: number;
    ariaMax: number;
    ariaValue: number;
    tabIndex?: number;
    zIndex?: number;
}) => {
    const [focused, setFocused] = useState(false);
    const [dragging, setDragging] = useState(false);
    const thumbSize = thumbSizeMap[size];
    const showTip = tooltip && (tooltipAlways || dragging || focused);
    const label = tooltipFormatter ? tooltipFormatter(value) : String(value);

    const posKey = vertical ? (reverse ? "top" : "bottom") : (reverse ? "right" : "left");
    const offset = `calc(${percent}% - ${thumbSize / 2}px)`;
    const crossKey = vertical ? "left" : "top";
    const crossVal = `calc(50% - ${thumbSize / 2}px)`;

    const thumbStyle: CSSProperties = {
        position: "absolute",
        [posKey]: offset,
        [crossKey]: crossVal,
        width: thumbSize,
        height: thumbSize,
        borderRadius: "50%",
        background: thumbColor,
        border: `2px solid ${trackColor}`,
        boxShadow: focused || dragging
            ? `0 0 0 4px ${trackColor}33, 0 2px 6px rgba(0,0,0,0.2)`
            : "0 1px 4px rgba(0,0,0,0.18)",
        cursor: disabled ? "not-allowed" : "grab",
        transform: dragging ? "scale(1.18)" : "scale(1)",
        transition: dragging ? "box-shadow 0.1s, border-color 0.1s" : "box-shadow 0.15s, transform 0.1s",
        zIndex,
        outline: "none",
        touchAction: "none",
    };

    const tooltipStyle: CSSProperties = {
        position: "absolute",
        background: trackColor,
        color: "#fff",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        opacity: showTip ? 1 : 0,
        transform: showTip
            ? (vertical ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(0)")
            : (vertical ? "translateX(-50%) translateY(4px)" : "translateX(-50%) translateY(-4px)"),
        transition: "opacity 0.15s, transform 0.15s",
        zIndex: 10,
        ...(vertical ? {
            left: "50%",
            bottom: `calc(100% + 6px)`,
            top: "auto",
        } : {
            left: "50%",
            bottom: `calc(100% + 8px)`,
        }),
    };

    return (
        <span
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={ariaMin}
            aria-valuemax={ariaMax}
            aria-valuenow={ariaValue}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : tabIndex}
            style={thumbStyle}
            onPointerDown={(e) => {
                if (disabled) return;
                setDragging(true);
                onPointerDown(e);
            }}
            onPointerUp={() => setDragging(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
        >
            {/* Tooltip */}
            {tooltip && (
                <span style={tooltipStyle}>{label}</span>
            )}
        </span>
    );
};

// ─── RangeSlider ──────────────────────────────────────────────────────────────

export const RangeSlider = ({
    min = 0,
    max = 100,
    step = 1,
    value,
    rangeValue,
    defaultValue = 0,
    defaultRangeValue = [20, 80],
    onChange,
    onRangeChange,
    onAfterChange,
    range = false,
    size = "md",
    variant = "primary",
    trackColor: trackColorProp,
    thumbColor: thumbColorProp,
    disabled = false,
    marks = false,
    tooltip = true,
    tooltipAlways = false,
    tooltipFormatter,
    showEndLabels = false,
    showValue = false,
    reverse = false,
    vertical = false,
    verticalHeight = "200px",
    label = "Slider",
    className = "",
}: RangeSliderProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ── Color resolution ──────────────────────────────────────────────────────
    const variantColorMap: Record<Variant, string> = {
        primary: c.accent ?? "#6366f1",
        success: c.success ?? "#22c55e",
        danger: c.danger ?? "#ef4444",
        warning: "#f59e0b",
        custom: trackColorProp ?? c.accent ?? "#6366f1",
    };

    const trackColor = trackColorProp ?? variantColorMap[variant];
    const thumbColor = thumbColorProp ?? "#ffffff";
    const trackBg = c.primaryBorder ?? "#e5e7eb";

    // ── State (controlled / uncontrolled) ─────────────────────────────────────
    const isControlledSingle = value !== undefined;
    const isControlledRange = rangeValue !== undefined;

    const [internalSingle, setInternalSingle] = useState<number>(defaultValue);
    const [internalRange, setInternalRange] = useState<[number, number]>(defaultRangeValue);

    const singleVal = isControlledSingle ? (value ?? min) : internalSingle;
    const [lo, hi] = isControlledRange ? (rangeValue ?? [min, max]) : internalRange;

    // ── Track ref for coordinate math ─────────────────────────────────────────
    const trackRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<"single" | "lo" | "hi" | null>(null);

    // ── Percent helpers ───────────────────────────────────────────────────────
    const pct = (v: number) => toPercent(v, min, max);

    // ── Coord → value ─────────────────────────────────────────────────────────
    const coordToValue = useCallback((clientX: number, clientY: number): number => {
        const el = trackRef.current;
        if (!el) return min;
        const rect = el.getBoundingClientRect();
        let ratio: number;
        if (vertical) {
            ratio = reverse
                ? (clientY - rect.top) / rect.height
                : (rect.bottom - clientY) / rect.height;
        } else {
            ratio = reverse
                ? (rect.right - clientX) / rect.width
                : (clientX - rect.left) / rect.width;
        }
        const raw = ratio * (max - min) + min;
        return clamp(snapToStep(raw, min, step), min, max);
    }, [vertical, reverse, min, max, step]);

    // ── Pointer move handler (attached to window during drag) ─────────────────
    const handlePointerMove = useCallback((e: PointerEvent) => {
        const newVal = coordToValue(e.clientX, e.clientY);
        const which = draggingRef.current;

        if (which === "single") {
            if (!isControlledSingle) setInternalSingle(newVal);
            onChange?.(newVal);
        } else if (which === "lo") {
            const clamped = clamp(newVal, min, hi - step);
            if (!isControlledRange) setInternalRange([clamped, hi]);
            onRangeChange?.([clamped, hi]);
        } else if (which === "hi") {
            const clamped = clamp(newVal, lo + step, max);
            if (!isControlledRange) setInternalRange([lo, clamped]);
            onRangeChange?.([lo, clamped]);
        }
    }, [coordToValue, isControlledSingle, isControlledRange, onChange, onRangeChange, min, max, step, lo, hi]);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        const which = draggingRef.current;
        if (!which) return;
        const finalVal = coordToValue(e.clientX, e.clientY);
        if (which === "single") onAfterChange?.(finalVal);
        else if (which === "lo") onAfterChange?.([clamp(finalVal, min, hi - step), hi]);
        else if (which === "hi") onAfterChange?.([lo, clamp(finalVal, lo + step, max)]);
        draggingRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
    }, [coordToValue, onAfterChange, min, max, step, lo, hi, handlePointerMove]);

    const startDrag = useCallback((
        e: ReactPointerEvent<HTMLSpanElement>,
        which: "single" | "lo" | "hi"
    ) => {
        e.preventDefault();
        draggingRef.current = which;
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

    useEffect(() => {
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [handlePointerMove, handlePointerUp]);

    // ── Track click (jump to position) ───────────────────────────────────────
    const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        // Only trigger if not dragging
        if (draggingRef.current) return;
        const newVal = coordToValue(e.clientX, e.clientY);

        if (!range) {
            if (!isControlledSingle) setInternalSingle(newVal);
            onChange?.(newVal);
            onAfterChange?.(newVal);
        } else {
            // Snap to nearest thumb
            const distLo = Math.abs(newVal - lo);
            const distHi = Math.abs(newVal - hi);
            if (distLo <= distHi) {
                const clamped = clamp(newVal, min, hi - step);
                if (!isControlledRange) setInternalRange([clamped, hi]);
                onRangeChange?.([clamped, hi]);
                onAfterChange?.([clamped, hi]);
            } else {
                const clamped = clamp(newVal, lo + step, max);
                if (!isControlledRange) setInternalRange([lo, clamped]);
                onRangeChange?.([lo, clamped]);
                onAfterChange?.([lo, clamped]);
            }
        }
    }, [disabled, coordToValue, range, isControlledSingle, isControlledRange, onChange, onRangeChange, onAfterChange, lo, hi, min, max, step]);

    // ── Keyboard ──────────────────────────────────────────────────────────────
    const makeKeyHandler = useCallback((which: "single" | "lo" | "hi") =>
        (e: KeyboardEvent<HTMLSpanElement>) => {
            if (disabled) return;
            const s = e.shiftKey ? step * 10 : step;
            let current = which === "single" ? singleVal : which === "lo" ? lo : hi;
            let next = current;

            if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); next = current + s; }
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); next = current - s; }
            else if (e.key === "Home") { e.preventDefault(); next = min; }
            else if (e.key === "End") { e.preventDefault(); next = max; }
            else return;

            if (reverse) next = current - (next - current); // flip delta if reversed

            if (which === "single") {
                const v = clamp(snapToStep(next, min, step), min, max);
                if (!isControlledSingle) setInternalSingle(v);
                onChange?.(v);
                onAfterChange?.(v);
            } else if (which === "lo") {
                const v = clamp(snapToStep(next, min, step), min, hi - step);
                if (!isControlledRange) setInternalRange([v, hi]);
                onRangeChange?.([v, hi]);
                onAfterChange?.([v, hi]);
            } else {
                const v = clamp(snapToStep(next, min, step), lo + step, max);
                if (!isControlledRange) setInternalRange([lo, v]);
                onRangeChange?.([lo, v]);
                onAfterChange?.([lo, v]);
            }
        },
        [disabled, singleVal, lo, hi, step, min, max, reverse, isControlledSingle, isControlledRange, onChange, onRangeChange, onAfterChange]);

    // ── Marks ─────────────────────────────────────────────────────────────────
    const resolvedMarks: { value: number; label?: string }[] = (() => {
        if (!marks) return [];
        if (marks === true) {
            const result: { value: number }[] = [];
            for (let v = min; v <= max; v += step) result.push({ value: v });
            return result;
        }
        return marks;
    })();

    // ── Track fill geometry ───────────────────────────────────────────────────
    const trackHeight = trackHeightMap[size];

    const fillStyle: CSSProperties = (() => {
        const start = range ? pct(lo) : 0;
        const end = range ? pct(hi) : pct(singleVal);
        const size = end - start;

        if (vertical) {
            return {
                bottom: reverse ? `${100 - end}%` : `${start}%`,
                height: `${size}%`,
                width: "100%",
                top: "auto",
            };
        }
        return {
            left: reverse ? `${100 - end}%` : `${start}%`,
            width: `${size}%`,
        };
    })();

    // ── Wrapper style ─────────────────────────────────────────────────────────
    const wrapperStyle: CSSProperties = vertical
        ? { display: "inline-flex", flexDirection: "column", alignItems: "center", height: verticalHeight, position: "relative", padding: "10px 20px" }
        : { display: "flex", alignItems: "center", width: "100%", position: "relative", padding: "10px 0" };

    const trackStyle: CSSProperties = vertical
        ? { position: "relative", width: trackHeight, height: "100%", borderRadius: 9999, background: trackBg, cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0 }
        : { position: "relative", height: trackHeight, width: "100%", borderRadius: 9999, background: trackBg, cursor: disabled ? "not-allowed" : "pointer" };

    const fillBaseStyle: CSSProperties = {
        position: "absolute",
        background: disabled ? trackBg : trackColor,
        borderRadius: 9999,
        transition: draggingRef.current ? "none" : "all 0.1s",
        ...(vertical ? { left: 0 } : { top: 0, bottom: 0 }),
        ...fillStyle,
    };

    // ── Thumb props shared ────────────────────────────────────────────────────
    const commonThumbProps = {
        size,
        thumbColor,
        trackColor: disabled ? (trackBg) : trackColor,
        disabled,
        tooltip,
        tooltipAlways,
        tooltipFormatter,
        vertical,
        reverse,
    };

    return (
        <div className={cx("w-full", className)}>
            {/* Top value label */}
            {showValue && !range && (
                <div style={{ textAlign: "right", fontSize: 12, fontWeight: 600, color: trackColor, marginBottom: 2 }}>
                    {tooltipFormatter ? tooltipFormatter(singleVal) : singleVal}
                </div>
            )}
            {showValue && range && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: trackColor, marginBottom: 2 }}>
                    <span>{tooltipFormatter ? tooltipFormatter(lo) : lo}</span>
                    <span>{tooltipFormatter ? tooltipFormatter(hi) : hi}</span>
                </div>
            )}

            <div style={wrapperStyle}>
                {/* Min label */}
                {showEndLabels && (
                    <span style={{ fontSize: 11, color: "#9ca3af", marginRight: vertical ? 0 : 8, marginBottom: vertical ? 8 : 0, flexShrink: 0 }}>
                        {min}
                    </span>
                )}

                {/* Track */}
                <div
                    ref={trackRef}
                    style={trackStyle}
                    onClick={handleTrackClick}
                >
                    {/* Filled portion */}
                    <span style={fillBaseStyle} />

                    {/* Marks */}
                    {resolvedMarks.map((mark) => {
                        const mp = pct(mark.value);
                        const isActive = range
                            ? mark.value >= lo && mark.value <= hi
                            : mark.value <= singleVal;
                        const dotStyle: CSSProperties = vertical
                            ? {
                                position: "absolute",
                                left: "50%",
                                bottom: reverse ? `${100 - mp}%` : `${mp}%`,
                                transform: "translate(-50%, 50%)",
                                width: 6, height: 6,
                                borderRadius: "50%",
                                background: isActive ? trackColor : "#d1d5db",
                                pointerEvents: "none",
                            }
                            : {
                                position: "absolute",
                                top: "50%",
                                left: reverse ? `${100 - mp}%` : `${mp}%`,
                                transform: "translate(-50%, -50%)",
                                width: 6, height: 6,
                                borderRadius: "50%",
                                background: isActive ? trackColor : "#d1d5db",
                                pointerEvents: "none",
                            };
                        return (
                            <span key={mark.value} style={dotStyle}>
                                {mark.label && (
                                    <span style={{
                                        position: "absolute",
                                        top: vertical ? "auto" : "calc(100% + 8px)",
                                        left: vertical ? "calc(100% + 8px)" : "50%",
                                        transform: vertical ? "translateY(-50%)" : "translateX(-50%)",
                                        fontSize: 10,
                                        color: "#6b7280",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                    }}>
                                        {mark.label}
                                    </span>
                                )}
                            </span>
                        );
                    })}

                    {/* Thumbs */}
                    {!range ? (
                        <Thumb
                            {...commonThumbProps}
                            percent={pct(singleVal)}
                            value={singleVal}
                            ariaLabel={label}
                            ariaMin={min}
                            ariaMax={max}
                            ariaValue={singleVal}
                            onPointerDown={(e) => startDrag(e, "single")}
                            onKeyDown={makeKeyHandler("single")}
                        />
                    ) : (
                        <>
                            <Thumb
                                {...commonThumbProps}
                                percent={pct(lo)}
                                value={lo}
                                ariaLabel={`${label} minimum`}
                                ariaMin={min}
                                ariaMax={hi}
                                ariaValue={lo}
                                onPointerDown={(e) => startDrag(e, "lo")}
                                onKeyDown={makeKeyHandler("lo")}
                                zIndex={lo > (min + max) / 2 ? 3 : 2}
                            />
                            <Thumb
                                {...commonThumbProps}
                                percent={pct(hi)}
                                value={hi}
                                ariaLabel={`${label} maximum`}
                                ariaMin={lo}
                                ariaMax={max}
                                ariaValue={hi}
                                onPointerDown={(e) => startDrag(e, "hi")}
                                onKeyDown={makeKeyHandler("hi")}
                                tabIndex={1}
                                zIndex={hi < (min + max) / 2 ? 3 : 2}
                            />
                        </>
                    )}
                </div>

                {/* Max label */}
                {showEndLabels && (
                    <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: vertical ? 0 : 8, marginTop: vertical ? 8 : 0, flexShrink: 0 }}>
                        {max}
                    </span>
                )}
            </div>
        </div>
    );
};

//Example usage:
// Basic
{/* <RangeSlider defaultValue={40} onChange={(v) => console.log(v)} /> */ }

// Dual-thumb range
{/* <RangeSlider range defaultRangeValue={[20, 70]} onRangeChange={setRange} /> */ }

// Controlled with custom formatter
{/* <RangeSlider
    value={price}
    onChange={setPrice}
    min={0} max={1000} step={10}
    tooltipFormatter={(v) => `$${v}`}
    showValue
    variant="success"
/> */}

// Marks with labels
{/* <RangeSlider
    min={0} max={100} step={25}
    marks={[
        { value: 0,   label: "Cold" },
        { value: 25,  label: "Mild" },
        { value: 50,  label: "Warm" },
        { value: 75,  label: "Hot" },
        { value: 100, label: "🔥" },
    ]}
    defaultValue={50}
    showEndLabels
/> */}

// Vertical
{/* <RangeSlider vertical verticalHeight="180px" defaultValue={60} variant="danger" /> */ }

// Reversed
{/* <RangeSlider reverse defaultValue={30} tooltip tooltipAlways /> */ }