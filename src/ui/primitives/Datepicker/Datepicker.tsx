import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
    type CSSProperties,
    type KeyboardEvent,
} from "react";
import { useTheme } from "../../theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";
type Mode = "single" | "range" | "multiple" | "month" | "year";
type View = "days" | "months" | "years";
type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday

export interface DatePickerProps {
    // ── Value ────────────────────────────────────────────────────────────────
    /** Single date (controlled) */
    value?: Date | null;
    /** Range dates (controlled) */
    rangeValue?: [Date | null, Date | null];
    /** Multiple dates (controlled) */
    multipleValue?: Date[];
    /** Defaults */
    defaultValue?: Date | null;
    defaultRangeValue?: [Date | null, Date | null];
    defaultMultipleValue?: Date[];

    // ── Callbacks ────────────────────────────────────────────────────────────
    onChange?: (date: Date | null) => void;
    onRangeChange?: (range: [Date | null, Date | null]) => void;
    onMultipleChange?: (dates: Date[]) => void;
    /** Fires when any selection changes - unified callback */
    onSelect?: (value: Date | Date[] | [Date | null, Date | null] | null) => void;

    // ── Mode ─────────────────────────────────────────────────────────────────
    /** Picker mode. Default: "single" */
    mode?: Mode;

    // ── Constraints ──────────────────────────────────────────────────────────
    minDate?: Date;
    maxDate?: Date;
    /** Disable specific dates */
    disabledDates?: Date[];
    /** Custom predicate to disable dates */
    disabledDate?: (date: Date) => boolean;
    /** Days of week to disable: 0=Sun … 6=Sat */
    disabledDaysOfWeek?: number[];

    // ── Display ──────────────────────────────────────────────────────────────
    placeholder?: string;
    label?: string;
    helperText?: string;
    status?: Status;
    size?: Size;
    variant?: Variant;
    /** Start of week: 0=Sunday, 1=Monday */
    weekStart?: WeekStart;
    /** Show week numbers */
    showWeekNumbers?: boolean;
    /** Highlight today */
    highlightToday?: boolean;
    /** Show clear button */
    allowClear?: boolean;
    /** Show today / clear shortcuts in footer */
    showFooter?: boolean;
    /** Show month/year in a dropdown instead of arrows */
    showMonthYearDropdowns?: boolean;
    /** Format for display. Default: "MM/dd/yyyy" */
    displayFormat?: string;
    /** Number of months to show side by side (range mode) */
    numberOfMonths?: number;

    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    /** Inline mode - renders calendar directly without an input trigger */
    inline?: boolean;
    /** Initial view. Default: "days" */
    defaultView?: View;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
// const DAYS_NARROW = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { h: number; font: number; cellSize: number; pad: number; radius: number }> = {
    sm: { h: 32, font: 12, cellSize: 28, pad: 8, radius: 6 },
    md: { h: 40, font: 14, cellSize: 34, pad: 12, radius: 8 },
    lg: { h: 48, font: 15, cellSize: 40, pad: 14, radius: 10 },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRight = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const ChevronsLeft = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
    </svg>
);

const ChevronsRight = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
    </svg>
);

const CalendarIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ClearIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── Date Utilities ───────────────────────────────────────────────────────────

function isSameDay(a: Date | null, b: Date | null): boolean {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

// function isSameMonth(a: Date, b: Date): boolean {
//     return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
// }

// function isSameYear(a: Date, b: Date): boolean {
//     return a.getFullYear() === b.getFullYear();
// }

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

// function endOfMonth(d: Date): Date {
//     return new Date(d.getFullYear(), d.getMonth() + 1, 0);
// }

function addMonths(d: Date, n: number): Date {
    const r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
}

function getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
}

function formatDate(date: Date | null, fmt: string): string {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return fmt
        .replace("yyyy", String(y))
        .replace("MMM", MONTHS_SHORT[date.getMonth()])
        .replace("MM", m)
        .replace("dd", d);
}

function buildCalendarDays(year: number, month: number, weekStart: WeekStart): (Date | null)[] {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = (first.getDay() - weekStart + 7) % 7;
    const totalDays = last.getDate();
    const cells: (Date | null)[] = [];

    // Leading nulls
    for (let i = 0; i < startDay; i++) cells.push(null);
    // Days
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    // Trailing nulls to fill grid
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

function cx(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// ─── Calendar Panel (reusable month grid) ────────────────────────────────────

interface CalendarPanelProps {
    viewDate: Date;
    mode: Mode;
    view: View;
    weekStart: WeekStart;
    showWeekNumbers: boolean;
    highlightToday: boolean;
    selectedDate?: Date | null;
    rangeStart?: Date | null;
    rangeEnd?: Date | null;
    hoverDate?: Date | null;
    multipleDates?: Date[];
    minDate?: Date;
    maxDate?: Date;
    disabledDate?: (d: Date) => boolean;
    disabledDatesSet?: Set<string>;
    disabledDaysOfWeek?: number[];
    accentColor: string;
    textColor: string;
    mutedColor: string;
    borderColor: string;
    surfaceBg: string;
    font: number;
    cellSize: number;
    radius: number;
    showMonthYearDropdowns: boolean;
    numberOfMonths: number;
    panelIndex: number;
    onViewDateChange: (d: Date) => void;
    onViewChange: (v: View) => void;
    onDayClick: (d: Date) => void;
    onDayHover: (d: Date | null) => void;
}

const CalendarPanel = ({
    viewDate, mode, view, weekStart, showWeekNumbers, highlightToday,
    selectedDate, rangeStart, rangeEnd, hoverDate, multipleDates,
    minDate, maxDate, disabledDate, disabledDatesSet, disabledDaysOfWeek,
    accentColor, textColor, mutedColor, borderColor,
    font, cellSize, radius, showMonthYearDropdowns, numberOfMonths, panelIndex,
    onViewDateChange, onViewChange, onDayClick, onDayHover,
}: CalendarPanelProps) => {
    const today = startOfDay(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = buildCalendarDays(year, month, weekStart);
    const dayHeaders = [...DAYS_SHORT.slice(weekStart), ...DAYS_SHORT.slice(0, weekStart)];

    // Year range for year view
    const yearRangeStart = Math.floor(year / 12) * 12;
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isDisabled = useCallback((d: Date): boolean => {
        if (minDate && startOfDay(d) < startOfDay(minDate)) return true;
        if (maxDate && startOfDay(d) > startOfDay(maxDate)) return true;
        if (disabledDatesSet?.has(d.toDateString())) return true;
        if (disabledDaysOfWeek?.includes(d.getDay())) return true;
        if (disabledDate?.(d)) return true;
        return false;
    }, [minDate, maxDate, disabledDatesSet, disabledDaysOfWeek, disabledDate]);

    const isInRange = useCallback((d: Date): boolean => {
        if (mode !== "range") return false;
        const start = rangeStart;
        const end = rangeEnd ?? hoverDate;
        if (!start || !end) return false;
        const s = start < end ? start : end;
        const e = start < end ? end : start;
        return startOfDay(d) > startOfDay(s) && startOfDay(d) < startOfDay(e);
    }, [mode, rangeStart, rangeEnd, hoverDate]);

    const isRangeEdge = useCallback((d: Date): "start" | "end" | null => {
        if (mode !== "range") return null;
        const end = rangeEnd ?? hoverDate;
        if (rangeStart && isSameDay(d, rangeStart)) return "start";
        if (end && isSameDay(d, end)) return "end";
        return null;
    }, [mode, rangeStart, rangeEnd, hoverDate]);

    const isSelected = useCallback((d: Date): boolean => {
        if (mode === "single" || mode === "month" || mode === "year") return isSameDay(d, selectedDate ?? null);
        if (mode === "multiple") return multipleDates?.some((md) => isSameDay(md, d)) ?? false;
        return isRangeEdge(d) !== null;
    }, [mode, selectedDate, multipleDates, isRangeEdge]);

    // ── Day cell style ────────────────────────────────────────────────────────
    const dayCellStyle = (d: Date | null): CSSProperties => {
        if (!d) return { width: cellSize, height: cellSize };
        const selected = isSelected(d);
        const inRange = isInRange(d);
        const edge = isRangeEdge(d);
        const isToday = highlightToday && isSameDay(d, today);
        const disabled = isDisabled(d);
        const isHover = hoverDate && isSameDay(d, hoverDate);
        const otherMonth = d.getMonth() !== month;

        return {
            width: cellSize,
            height: cellSize,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: selected || edge ? "50%" : inRange ? 0 : radius / 2,
            fontSize: font - 1,
            fontWeight: selected || isToday ? 700 : 400,
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.1s",
            userSelect: "none",
            position: "relative",
            background:
                selected || edge ? accentColor :
                    inRange ? `${accentColor}18` :
                        isHover && !disabled ? `${accentColor}12` :
                            "transparent",
            color:
                selected || edge ? "#fff" :
                    disabled ? mutedColor :
                        otherMonth ? `${mutedColor}80` :
                            isToday ? accentColor :
                                textColor,
            boxShadow: isToday && !selected ? `inset 0 0 0 1.5px ${accentColor}` : "none",
            opacity: disabled ? 0.45 : 1,
        };
    };

    const headerBtnStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: cellSize,
        height: cellSize,
        borderRadius: radius / 2,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: mutedColor,
        transition: "background 0.12s, color 0.12s",
        flexShrink: 0,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // YEAR VIEW
    if (view === "years") {
        return (
            <div style={{ width: cellSize * 7 + (showWeekNumbers ? cellSize : 0) }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <button style={headerBtnStyle} onClick={() => onViewDateChange(new Date(year - 12, month, 1))}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                        <ChevronsLeft size={font + 2} color="currentColor" />
                    </button>
                    <span style={{ fontSize: font, fontWeight: 600, color: textColor }}>
                        {yearRangeStart} – {yearRangeStart + 11}
                    </span>
                    <button style={headerBtnStyle} onClick={() => onViewDateChange(new Date(year + 12, month, 1))}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                        <ChevronsRight size={font + 2} color="currentColor" />
                    </button>
                </div>
                {/* Year grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                    {years.map(y => {
                        const isCurrentYear = y === new Date().getFullYear();
                        const isSelected = y === year;
                        return (
                            <button key={y}
                                onClick={() => {
                                    if (mode === "year") {
                                        onDayClick(new Date(y, 0, 1));
                                    } else {
                                        onViewDateChange(new Date(y, month, 1));
                                        onViewChange("months");
                                    }
                                }}
                                style={{
                                    height: cellSize, borderRadius: radius / 2, border: "none",
                                    background: isSelected ? accentColor : "transparent",
                                    color: isSelected ? "#fff" : isCurrentYear ? accentColor : textColor,
                                    fontWeight: isSelected || isCurrentYear ? 700 : 400,
                                    fontSize: font - 1, cursor: "pointer",
                                    boxShadow: isCurrentYear && !isSelected ? `inset 0 0 0 1.5px ${accentColor}` : "none",
                                    transition: "all 0.1s",
                                }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; }}
                                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                {y}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // MONTH VIEW
    if (view === "months") {
        return (
            <div style={{ width: cellSize * 7 + (showWeekNumbers ? cellSize : 0) }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <button style={headerBtnStyle} onClick={() => onViewDateChange(new Date(year - 1, month, 1))}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                        <ChevronLeft size={font + 2} color="currentColor" />
                    </button>
                    <button style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: font, fontWeight: 600, color: textColor }}
                        onClick={() => onViewChange("years")}>
                        {year}
                    </button>
                    <button style={headerBtnStyle} onClick={() => onViewDateChange(new Date(year + 1, month, 1))}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                        <ChevronRight size={font + 2} color="currentColor" />
                    </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                    {MONTHS_SHORT.map((m, idx) => {
                        const isCurrentMonth = idx === new Date().getMonth() && year === new Date().getFullYear();
                        const isSelected = idx === month;
                        return (
                            <button key={m} onClick={() => {
                                if (mode === "month") {
                                    onDayClick(new Date(year, idx, 1));
                                } else {
                                    onViewDateChange(new Date(year, idx, 1));
                                    onViewChange("days");
                                }
                            }}
                                style={{
                                    height: cellSize, borderRadius: radius / 2, border: "none",
                                    background: isSelected ? accentColor : "transparent",
                                    color: isSelected ? "#fff" : isCurrentMonth ? accentColor : textColor,
                                    fontWeight: isSelected || isCurrentMonth ? 700 : 400,
                                    fontSize: font - 1, cursor: "pointer",
                                    boxShadow: isCurrentMonth && !isSelected ? `inset 0 0 0 1.5px ${accentColor}` : "none",
                                    transition: "all 0.1s",
                                }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; }}
                                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                {m}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // DAY VIEW
    const totalWidth = cellSize * 7 + (showWeekNumbers ? cellSize : 0);

    return (
        <div style={{ width: totalWidth }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                {/* Prev year / prev month - only show on first panel */}
                <div style={{ display: "flex", gap: 2 }}>
                    {panelIndex === 0 && (
                        <>
                            <button style={headerBtnStyle} onClick={() => onViewDateChange(new Date(year - 1, month, 1))}
                                title="Previous year"
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                                <ChevronsLeft size={font} color="currentColor" />
                            </button>
                            <button style={headerBtnStyle} onClick={() => onViewDateChange(addMonths(viewDate, -1))}
                                title="Previous month"
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                                <ChevronLeft size={font} color="currentColor" />
                            </button>
                        </>
                    )}
                </div>

                {/* Month / Year title */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
                    {showMonthYearDropdowns ? (
                        <>
                            <select value={month}
                                onChange={e => onViewDateChange(new Date(year, Number(e.target.value), 1))}
                                style={{ fontSize: font - 1, fontWeight: 600, border: `1px solid ${borderColor}`, borderRadius: radius / 2, padding: "1px 4px", color: textColor, background: "#fff", cursor: "pointer" }}>
                                {MONTHS_LONG.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <select value={year}
                                onChange={e => onViewDateChange(new Date(Number(e.target.value), month, 1))}
                                style={{ fontSize: font - 1, fontWeight: 600, border: `1px solid ${borderColor}`, borderRadius: radius / 2, padding: "1px 4px", color: textColor, background: "#fff", cursor: "pointer" }}>
                                {Array.from({ length: 201 }, (_, i) => 1900 + i).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </>
                    ) : (
                        <>
                            <button style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: font, fontWeight: 700, color: textColor, padding: "2px 4px" }}
                                onClick={() => onViewChange("months")}>
                                {MONTHS_LONG[month]}
                            </button>
                            <button style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: font, fontWeight: 700, color: textColor, padding: "2px 4px" }}
                                onClick={() => onViewChange("years")}>
                                {year}
                            </button>
                        </>
                    )}
                </div>

                {/* Next month / next year - only on last panel */}
                <div style={{ display: "flex", gap: 2 }}>
                    {panelIndex === numberOfMonths - 1 && (
                        <>
                            <button style={headerBtnStyle} onClick={() => onViewDateChange(addMonths(viewDate, 1))}
                                title="Next month"
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                                <ChevronRight size={font} color="currentColor" />
                            </button>
                            <button style={headerBtnStyle} onClick={() => onViewDateChange(new Date(year + 1, month, 1))}
                                title="Next year"
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLElement).style.color = accentColor; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = mutedColor; }}>
                                <ChevronsRight size={font} color="currentColor" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: showWeekNumbers ? `${cellSize}px repeat(7, ${cellSize}px)` : `repeat(7, ${cellSize}px)`, marginBottom: 4 }}>
                {showWeekNumbers && (
                    <div style={{ width: cellSize, height: cellSize - 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: font - 3, color: mutedColor, fontWeight: 500 }}>#</div>
                )}
                {dayHeaders.map((d, i) => (
                    <div key={i} style={{ width: cellSize, height: cellSize - 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: font - 2, color: mutedColor, fontWeight: 600, userSelect: "none" }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            {Array.from({ length: Math.ceil(days.length / 7) }, (_, rowIdx) => {
                const rowDays = days.slice(rowIdx * 7, rowIdx * 7 + 7);
                const weekNum = showWeekNumbers && rowDays.find(d => d) ? getWeekNumber(rowDays.find(d => d) as Date) : null;
                return (
                    <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: showWeekNumbers ? `${cellSize}px repeat(7, ${cellSize}px)` : `repeat(7, ${cellSize}px)`, marginBottom: 2 }}>
                        {showWeekNumbers && (
                            <div style={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", fontSize: font - 3, color: `${mutedColor}80`, fontWeight: 500 }}>
                                {weekNum}
                            </div>
                        )}
                        {rowDays.map((d, colIdx) => {
                            if (!d) return <div key={colIdx} style={{ width: cellSize, height: cellSize }} />;
                            const disabled = isDisabled(d);
                            return (
                                <div
                                    key={colIdx}
                                    style={dayCellStyle(d)}
                                    onClick={() => !disabled && onDayClick(d)}
                                    onMouseEnter={() => !disabled && onDayHover(d)}
                                    onMouseLeave={() => onDayHover(null)}
                                    aria-label={d.toDateString()}
                                    role="button"
                                    tabIndex={disabled ? -1 : 0}
                                    aria-pressed={isSelected(d)}
                                    aria-disabled={disabled}
                                >
                                    {d.getDate()}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

// ─── DatePicker ───────────────────────────────────────────────────────────────

export const DatePicker = ({
    value,
    rangeValue,
    multipleValue,
    defaultValue = null,
    defaultRangeValue = [null, null],
    defaultMultipleValue = [],
    onChange,
    onRangeChange,
    onMultipleChange,
    onSelect,
    mode = "single",
    minDate,
    maxDate,
    disabledDates,
    disabledDate,
    disabledDaysOfWeek,
    placeholder,
    label,
    helperText,
    status = "default",
    size = "md",
    variant = "outline",
    weekStart = 0,
    showWeekNumbers = false,
    highlightToday = true,
    allowClear = true,
    showFooter = true,
    showMonthYearDropdowns = false,
    displayFormat = "MM/dd/yyyy",
    numberOfMonths = 1,
    disabled = false,
    readOnly = false,
    className = "",
    inline = false,
    defaultView = "days",
}: DatePickerProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const { h, font, cellSize, pad, radius } = sizeMap[size];

    // ── Colors ────────────────────────────────────────────────────────────────
    const accentColor = c.accent ?? "#6366f1";
    const dangerColor = c.danger ?? "#ef4444";
    const successColor = c.success ?? "#22c55e";
    const warningColor = "#f59e0b";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = "#111827";
    const mutedColor = "#9ca3af";
    const bgColor = "#ffffff";
    const surfaceBg = c.primaryLight ?? "#f9fafb";

    const statusColorMap: Record<Status, string> = {
        default: accentColor,
        error: dangerColor,
        success: successColor,
        warning: warningColor,
    };
    const focusColor = statusColorMap[status];

    // ── State ─────────────────────────────────────────────────────────────────
    const [open, setOpen] = useState(inline);
    const [focused, setFocused] = useState(false);
    const [view, setView] = useState<View>(
        mode === "month" ? "months" : mode === "year" ? "years" : defaultView
    );
    const [viewDate, setViewDate] = useState<Date>(() => {
        const base = (mode === "single" ? defaultValue : mode === "range" ? defaultRangeValue[0] : null) ?? new Date();
        return startOfMonth(base);
    });
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    // Single
    const isCtrlSingle = value !== undefined;
    const [intSingle, setIntSingle] = useState<Date | null>(defaultValue);
    const singleDate = isCtrlSingle ? (value ?? null) : intSingle;

    // Range
    const isCtrlRange = rangeValue !== undefined;
    const [intRange, setIntRange] = useState<[Date | null, Date | null]>(defaultRangeValue);
    const [rangeStart, rangeEnd] = isCtrlRange ? (rangeValue ?? [null, null]) : intRange;
    const [rangePicking, setRangePicking] = useState<"start" | "end">("start");

    // Multiple
    const isCtrlMulti = multipleValue !== undefined;
    const [intMulti, setIntMulti] = useState<Date[]>(defaultMultipleValue);
    const multipleDates = isCtrlMulti ? (multipleValue ?? []) : intMulti;

    // ── Disabled dates set ────────────────────────────────────────────────────
    const disabledDatesSet = useMemo(() => {
        if (!disabledDates) return undefined;
        return new Set(disabledDates.map(d => d.toDateString()));
    }, [disabledDates]);

    // ── Ref + close on outside click ──────────────────────────────────────────
    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (inline || !open) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, inline]);

    // ── Panel view dates (multi-month) ────────────────────────────────────────
    const panelViewDates = useMemo(() =>
        Array.from({ length: numberOfMonths }, (_, i) => addMonths(viewDate, i)),
        [viewDate, numberOfMonths]
    );

    // ── Day click ─────────────────────────────────────────────────────────────
    const handleDayClick = useCallback((d: Date) => {
        if (mode === "single") {
            if (!isCtrlSingle) setIntSingle(d);
            onChange?.(d);
            onSelect?.(d);
            if (!inline) setOpen(false);

        } else if (mode === "range") {
            if (rangePicking === "start" || (rangeStart && rangeEnd)) {
                const newRange: [Date, null] = [d, null];
                if (!isCtrlRange) setIntRange(newRange);
                onRangeChange?.(newRange);
                setRangePicking("end");
            } else {
                const start = rangeStart!;
                const [s, e] = d < start ? [d, start] : [start, d];
                const newRange: [Date, Date] = [s, e];
                if (!isCtrlRange) setIntRange(newRange);
                onRangeChange?.(newRange);
                onSelect?.(newRange);
                setRangePicking("start");
                if (!inline) setOpen(false);
            }

        } else if (mode === "multiple") {
            const exists = multipleDates.some(md => isSameDay(md, d));
            const next = exists ? multipleDates.filter(md => !isSameDay(md, d)) : [...multipleDates, d];
            if (!isCtrlMulti) setIntMulti(next);
            onMultipleChange?.(next);
            onSelect?.(next);

        } else if (mode === "month") {
            if (!isCtrlSingle) setIntSingle(d);
            onChange?.(d);
            onSelect?.(d);
            if (!inline) setOpen(false);

        } else if (mode === "year") {
            if (!isCtrlSingle) setIntSingle(d);
            onChange?.(d);
            onSelect?.(d);
            if (!inline) setOpen(false);
        }
    }, [mode, rangePicking, rangeStart, rangeEnd, multipleDates, isCtrlSingle, isCtrlRange, isCtrlMulti, onChange, onRangeChange, onMultipleChange, onSelect, inline]);

    // ── Clear ─────────────────────────────────────────────────────────────────
    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (mode === "single" || mode === "month" || mode === "year") {
            if (!isCtrlSingle) setIntSingle(null);
            onChange?.(null);
            onSelect?.(null);
        } else if (mode === "range") {
            if (!isCtrlRange) setIntRange([null, null]);
            onRangeChange?.([null, null]);
            onSelect?.(null);
            setRangePicking("start");
        } else {
            if (!isCtrlMulti) setIntMulti([]);
            onMultipleChange?.([]);
            onSelect?.(null);
        }
    }, [mode, isCtrlSingle, isCtrlRange, isCtrlMulti, onChange, onRangeChange, onMultipleChange, onSelect]);

    // ── Display value ─────────────────────────────────────────────────────────
    const displayValue = useMemo(() => {
        if (mode === "single" || mode === "month" || mode === "year") {
            return singleDate ? formatDate(singleDate, displayFormat) : "";
        }
        if (mode === "range") {
            const s = rangeStart ? formatDate(rangeStart, displayFormat) : "";
            const e = rangeEnd ? formatDate(rangeEnd, displayFormat) : "";
            if (!s && !e) return "";
            return `${s} - ${e || "..."}`;
        }
        if (mode === "multiple") {
            if (!multipleDates.length) return "";
            if (multipleDates.length === 1) return formatDate(multipleDates[0], displayFormat);
            return `${multipleDates.length} dates selected`;
        }
        return "";
    }, [mode, singleDate, rangeStart, rangeEnd, multipleDates, displayFormat]);

    const hasValue = displayValue.length > 0;

    // ── Placeholder ───────────────────────────────────────────────────────────
    const resolvedPlaceholder = placeholder ?? (
        mode === "range" ? "Start date - End date" :
            mode === "multiple" ? "Select dates" :
                mode === "month" ? "Select month" :
                    mode === "year" ? "Select year" :
                        "Select date"
    );

    // ── Input container style ─────────────────────────────────────────────────
    const borderVal = focused || open ? focusColor : (status !== "default" ? statusColorMap[status] : borderColor);

    const containerStyle: CSSProperties = (() => {
        const base: CSSProperties = {
            display: "flex",
            alignItems: "center",
            height: h,
            borderRadius: radius,
            padding: `0 ${pad}px`,
            gap: 8,
            cursor: disabled ? "not-allowed" : readOnly ? "default" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "all 0.15s",
            userSelect: "none",
        };
        switch (variant) {
            case "filled":
                return { ...base, background: (focused || open) ? bgColor : surfaceBg, border: `1.5px solid ${(focused || open) ? focusColor : "transparent"}`, boxShadow: (focused || open) ? `0 0 0 3px ${focusColor}22` : "none" };
            case "underline":
                return { ...base, borderRadius: 0, background: "transparent", borderBottom: `2px solid ${borderVal}`, padding: `0 ${pad * 0.5}px` };
            case "ghost":
                return { ...base, background: (focused || open) ? surfaceBg : "transparent", border: "none" };
            default:
                return { ...base, background: bgColor, border: `1.5px solid ${borderVal}`, boxShadow: (focused || open) ? `0 0 0 3px ${focusColor}22` : "none" };
        }
    })();

    // ── Popup / inline panel ──────────────────────────────────────────────────
    const popupPad = cellSize * 0.4;

    const CalendarPopup = (
        <div style={{
            background: bgColor,
            border: `1.5px solid ${borderColor}`,
            borderRadius: radius + 4,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
            padding: popupPad,
            display: "inline-flex",
            flexDirection: "column",
            animation: inline ? "none" : "dpDropIn 0.15s ease",
            ...(!inline && {
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 1000,
            }),
        }}>
            {/* Multi-month panels */}
            <div style={{ display: "flex", gap: cellSize * 0.6 }}>
                {panelViewDates.map((pvd, pi) => (
                    <CalendarPanel
                        key={pi}
                        viewDate={pvd}
                        mode={mode}
                        view={view}
                        weekStart={weekStart}
                        showWeekNumbers={showWeekNumbers}
                        highlightToday={highlightToday}
                        selectedDate={singleDate}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        hoverDate={hoverDate}
                        multipleDates={multipleDates}
                        minDate={minDate}
                        maxDate={maxDate}
                        disabledDate={disabledDate}
                        disabledDatesSet={disabledDatesSet}
                        disabledDaysOfWeek={disabledDaysOfWeek}
                        accentColor={accentColor}
                        textColor={textColor}
                        mutedColor={mutedColor}
                        borderColor={borderColor}
                        surfaceBg={surfaceBg}
                        font={font}
                        cellSize={cellSize}
                        radius={radius}
                        showMonthYearDropdowns={showMonthYearDropdowns}
                        numberOfMonths={numberOfMonths}
                        panelIndex={pi}
                        onViewDateChange={(d) => setViewDate(addMonths(d, -pi))}
                        onViewChange={setView}
                        onDayClick={handleDayClick}
                        onDayHover={setHoverDate}
                    />
                ))}
            </div>

            {/* Range hint */}
            {mode === "range" && rangeStart && !rangeEnd && (
                <div style={{ marginTop: 8, fontSize: font - 2, color: mutedColor, textAlign: "center" }}>
                    📅 Now select an end date
                </div>
            )}

            {/* Footer */}
            {showFooter && (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 10, paddingTop: 8, borderTop: `1px solid ${borderColor}`,
                    gap: 8,
                }}>
                    <button
                        onClick={() => {
                            const today = startOfDay(new Date());
                            setViewDate(startOfMonth(today));
                            handleDayClick(today);
                        }}
                        style={{
                            fontSize: font - 2, color: accentColor, border: "none",
                            background: "transparent", cursor: "pointer", fontWeight: 600,
                            padding: "2px 8px", borderRadius: radius / 2,
                            transition: "background 0.1s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}12`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        Today
                    </button>
                    {allowClear && hasValue && (
                        <button
                            onClick={handleClear}
                            style={{
                                fontSize: font - 2, color: dangerColor, border: "none",
                                background: "transparent", cursor: "pointer", fontWeight: 500,
                                padding: "2px 8px", borderRadius: radius / 2,
                                transition: "background 0.1s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${dangerColor}10`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            Clear
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    // ── Inline mode ───────────────────────────────────────────────────────────
    if (inline) {
        return (
            <div className={className} style={{ display: "inline-block" }}>
                {CalendarPopup}
                <style>{`
                    @keyframes dpDropIn {
                        from { opacity:0; transform:translateY(-6px); }
                        to   { opacity:1; transform:translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    // ── Trigger + popup mode ──────────────────────────────────────────────────
    return (
        <div ref={wrapperRef} className={cx("w-full", className)} style={{ position: "relative" }}>
            {/* Label */}
            {label && (
                <label style={{
                    display: "block", fontSize: font - 1, fontWeight: 500,
                    color: (focused || open) ? focusColor : textColor,
                    marginBottom: 4, transition: "color 0.15s", userSelect: "none",
                }}>
                    {label}
                </label>
            )}

            {/* Trigger */}
            <div
                style={containerStyle}
                onClick={() => {
                    if (disabled || readOnly) return;
                    setOpen(v => !v);
                    setFocused(true);
                }}
                onBlur={() => setFocused(false)}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={label ?? resolvedPlaceholder}
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); }
                    if (e.key === "Escape") setOpen(false);
                }}
            >
                <CalendarIcon size={font + 2} color={hasValue ? accentColor : mutedColor} />
                <span style={{
                    flex: 1, fontSize: font,
                    color: hasValue ? textColor : mutedColor,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {hasValue ? displayValue : resolvedPlaceholder}
                </span>
                {allowClear && hasValue && !disabled && !readOnly && (
                    <span
                        onClick={handleClear}
                        role="button"
                        aria-label="Clear"
                        style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: h * 0.6, height: h * 0.6, borderRadius: "50%",
                            flexShrink: 0, color: mutedColor, cursor: "pointer",
                            transition: "background 0.12s, color 0.12s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = dangerColor; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = mutedColor; }}
                    >
                        <ClearIcon size={font} color="currentColor" />
                    </span>
                )}
            </div>

            {/* Popup */}
            {open && CalendarPopup}

            {/* Helper text */}
            {helperText && (
                <p style={{
                    marginTop: 4, fontSize: font - 2, lineHeight: 1.4,
                    color: status === "error" ? dangerColor : status === "success" ? successColor : status === "warning" ? warningColor : mutedColor,
                }}>
                    {helperText}
                </p>
            )}

            <style>{`
                @keyframes dpDropIn {
                    from { opacity:0; transform:translateY(-6px); }
                    to   { opacity:1; transform:translateY(0); }
                }
            `}</style>
        </div>
    );
};

//Example usage:
// Single
{/* <DatePicker label="Date of Birth" onChange={(d) => console.log(d)} /> */ }

// Range - 2 months side by side
{/* <DatePicker
    mode="range"
    numberOfMonths={2}
    onRangeChange={([start, end]) => console.log(start, end)}
    label="Booking period"
    showFooter
/> */}

// Multiple select
{/* <DatePicker mode="multiple" onMultipleChange={(dates) => console.log(dates)} /> */ }

// Month picker
{/* <DatePicker mode="month" displayFormat="MMM yyyy" label="Select Month" /> */ }

// Year picker
{/* <DatePicker mode="year" displayFormat="yyyy" label="Select Year" /> */ }

// Inline (always visible, no input)
{/* <DatePicker inline mode="range" numberOfMonths={2} /> */ }

// Constraints + disabled weekends
{/* <DatePicker
    minDate={new Date()} maxDate={addMonths(new Date(), 3)}
    disabledDaysOfWeek={[0, 6]}
    weekStart={1}
    showWeekNumbers
/> */}

// Validation
{/* <DatePicker status="error" helperText="Please select a valid date" variant="outline" /> */ }

// Custom format + month/year dropdowns
{/* <DatePicker displayFormat="dd MMM yyyy" showMonthYearDropdowns size="lg" /> */ }