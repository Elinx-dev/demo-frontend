import React, {
    useId, useRef, useState, useEffect, useCallback,
    type CSSProperties, type KeyboardEvent,
} from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";

export interface AutocompleteOption {
    label: string;
    value: string;
    description?: string;
    icon?: React.ReactNode;
    badge?: string;
    /** Custom foreground colour for the badge chip */
    badgeColor?: string;
    disabled?: boolean;
    /** Used for grouping */
    group?: string;
}

export interface AutocompleteProps {
    options: AutocompleteOption[];
    /** Controlled selected value */
    value?: AutocompleteOption | null;
    /** Default value (uncontrolled) */
    defaultValue?: AutocompleteOption | null;
    onChange?: (option: AutocompleteOption | null) => void;
    /** Called on every input keystroke - use for async fetching */
    onInputChange?: (inputValue: string) => void;
    label?: string;
    name?: string;
    placeholder?: string;
    error?: string;
    helperText?: string;
    status?: Status;
    size?: Size;
    variant?: Variant;
    disabled?: boolean;
    readOnly?: boolean;
    /** Allow clearing the selected value */
    allowClear?: boolean;
    /** Allow typing a value not in options */
    freeSolo?: boolean;
    /** Show loading spinner (for async options) */
    loading?: boolean;
    /** Text shown when no options match */
    noOptionsText?: string;
    /** Text shown while loading */
    loadingText?: string;
    /** Max dropdown height in px */
    maxDropdownHeight?: number;
    /** Filter function override */
    filterOption?: (option: AutocompleteOption, inputValue: string) => boolean;
    /** Custom option renderer */
    renderOption?: (option: AutocompleteOption, isSelected: boolean, isHighlighted: boolean) => React.ReactNode;
    /** Group options into sections */
    groupBy?: (option: AutocompleteOption) => string;
    className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
    h: number; font: number; px: number; py: number;
    radius: number; iconSize: number; dropRadius: number; optPy: number;
}> = {
    sm: { h: 32, font: 12, px: 10, py: 5, radius: 6, iconSize: 14, dropRadius: 6, optPy: 6 },
    md: { h: 40, font: 14, px: 14, py: 9, radius: 8, iconSize: 16, dropRadius: 8, optPy: 9 },
    lg: { h: 48, font: 15, px: 16, py: 12, radius: 10, iconSize: 18, dropRadius: 10, optPy: 12 },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronDown = ({ size, color, open }: { size: number; color: string; open: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const XIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CheckIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SearchIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const Spinner = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
        style={{ animation: "acSpin 0.75s linear infinite", flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const ErrorIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const SuccessIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
    </svg>
);

// ─── Highlight match helper ───────────────────────────────────────────────────

const HighlightMatch = ({ text, query, color }: { text: string; query: string; color: string }) => {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark style={{ background: `${color}25`, color, fontWeight: 700, borderRadius: 2, padding: "0 1px" }}>
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
};

// ─── Default filter ───────────────────────────────────────────────────────────

const defaultFilter = (option: AutocompleteOption, input: string): boolean => {
    const q = input.toLowerCase();
    return (
        option.label.toLowerCase().includes(q) ||
        option.value.toLowerCase().includes(q) ||
        (option.description?.toLowerCase().includes(q) ?? false)
    );
};

// ─── Autocomplete ─────────────────────────────────────────────────────────────

export const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
    (
        {
            options,
            value,
            defaultValue = null,
            onChange,
            onInputChange,
            label,
            name,
            placeholder = "Search...",
            error,
            helperText,
            status = "default",
            size = "md",
            variant = "outline",
            disabled = false,
            readOnly = false,
            allowClear = true,
            freeSolo = false,
            loading = false,
            noOptionsText = "No options found",
            loadingText = "Loading...",
            maxDropdownHeight = 260,
            filterOption,
            renderOption,
            groupBy,
            className = "",
        },
        forwardedRef
    ) => {
        const { theme } = useTheme();
        const c = theme.colors;
        const autoId = useId();
        const id = name ?? autoId;

        // ── State ─────────────────────────────────────────────────────────────
        const isControlled = value !== undefined;
        const [internal, setInternal] = useState<AutocompleteOption | null>(defaultValue);
        const [inputValue, setInputValue] = useState(defaultValue?.label ?? "");
        const [isOpen, setIsOpen] = useState(false);
        const [highlightIdx, setHighlightIdx] = useState(0);
        const [focused, setFocused] = useState(false);

        const selected = isControlled ? value : internal;

        const setSelected = useCallback((opt: AutocompleteOption | null) => {
            if (!isControlled) setInternal(opt);
            onChange?.(opt);
        }, [isControlled, onChange]);

        // ── Refs ──────────────────────────────────────────────────────────────
        const containerRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);
        const listRef = useRef<HTMLUListElement>(null);

        // Merge forwardedRef with internal inputRef
        const mergedRef = (node: HTMLInputElement | null) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        };

        // ── Sync inputValue when controlled value changes ──────────────────────
        useEffect(() => {
            if (isControlled) setInputValue(value?.label ?? "");
        }, [isControlled, value]);

        // ── Close on outside click ────────────────────────────────────────────
        useEffect(() => {
            if (!isOpen) return;
            const handler = (e: MouseEvent) => {
                if (!containerRef.current?.contains(e.target as Node)) {
                    closeDropdown();
                }
            };
            document.addEventListener("mousedown", handler);
            return () => document.removeEventListener("mousedown", handler);
        }, [isOpen]);

        // ── Scroll highlighted into view ──────────────────────────────────────
        useEffect(() => {
            if (!listRef.current) return;
            const el = listRef.current.querySelector(`[data-idx="${highlightIdx}"]`) as HTMLElement;
            el?.scrollIntoView({ block: "nearest" });
        }, [highlightIdx]);

        // ── Filter options ────────────────────────────────────────────────────
        const filter = filterOption ?? defaultFilter;
        const filteredOptions = options.filter(opt => {
            // When user has selected and hasn't typed anything new - show all
            if (selected && inputValue === selected.label) return true;
            return filter(opt, inputValue);
        });

        // ── Group options ─────────────────────────────────────────────────────
        const grouped = groupBy
            ? filteredOptions.reduce<Record<string, AutocompleteOption[]>>((acc, opt) => {
                const g = groupBy(opt);
                if (!acc[g]) acc[g] = [];
                acc[g].push(opt);
                return acc;
            }, {})
            : null;

        // Flat index map for keyboard nav across groups
        const flatFiltered = grouped
            ? Object.values(grouped).flat()
            : filteredOptions;

        // ── Handlers ──────────────────────────────────────────────────────────
        const openDropdown = () => { if (!disabled && !readOnly) setIsOpen(true); };
        const closeDropdown = () => {
            setIsOpen(false);
            // If freeSolo and user typed something, keep it; otherwise restore selected label
            if (!freeSolo) setInputValue(selected?.label ?? "");
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setInputValue(val);
            onInputChange?.(val);
            setHighlightIdx(0);
            setIsOpen(true);
            // Clear selection when user types something different
            if (selected && val !== selected.label) {
                setSelected(null);
            }
        };

        const handleSelect = (opt: AutocompleteOption) => {
            if (opt.disabled) return;
            setSelected(opt);
            setInputValue(opt.label);
            setIsOpen(false);
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelected(null);
            setInputValue("");
            onInputChange?.("");
            setIsOpen(false);
            inputRef.current?.focus();
        };

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                openDropdown();
                setHighlightIdx(i => Math.min(i + 1, flatFiltered.length - 1));
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIdx(i => Math.max(i - 1, 0));
            }
            if (e.key === "Enter") {
                e.preventDefault();
                if (isOpen && flatFiltered[highlightIdx]) {
                    handleSelect(flatFiltered[highlightIdx]);
                } else if (freeSolo && inputValue) {
                    // freeSolo: commit the typed value
                    const opt: AutocompleteOption = { label: inputValue, value: inputValue };
                    setSelected(opt);
                    setIsOpen(false);
                }
            }
            if (e.key === "Escape") closeDropdown();
            if (e.key === "Tab") closeDropdown();
        };

        // ── Colors ────────────────────────────────────────────────────────────
        const accentColor = c.accent ?? "#6366f1";
        const dangerColor = c.danger ?? "#ef4444";
        const successColor = c.success ?? "#22c55e";
        const warningColor = "#f59e0b";
        const borderColor = c.primaryBorder ?? "#d1d5db";
        const textColor = c.text ?? "#111827";
        const mutedColor = c.textMuted ?? "#9ca3af";
        const surfaceBg = c.surface ?? "#ffffff";
        const surfaceAlt = c.primaryLight ?? "#f9fafb";

        const effectiveStatus: Status = error ? "error" : status;
        const statusColorMap: Record<Status, string> = {
            default: accentColor, error: dangerColor,
            success: successColor, warning: warningColor,
        };
        const statusBorderMap: Record<Status, string> = {
            default: borderColor, error: dangerColor,
            success: successColor, warning: warningColor,
        };

        const focusColor = statusColorMap[effectiveStatus];
        const borderVal = (focused || isOpen) ? focusColor : statusBorderMap[effectiveStatus];
        const hasError = !!error;
        const hasValue = !!selected || (freeSolo && !!inputValue);

        const { h, font, px, radius, iconSize, dropRadius, optPy } = sizeMap[size];

        // ── Wrapper style ─────────────────────────────────────────────────────
        const wrapperStyle: CSSProperties = (() => {
            const base: CSSProperties = {
                display: "flex",
                alignItems: "center",
                height: h,
                borderRadius: radius,
                overflow: "hidden",
                transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
                opacity: disabled ? 0.55 : 1,
                boxSizing: "border-box" as const,
                width: "100%",
            };
            switch (variant) {
                case "filled":
                    return { ...base, background: (focused || isOpen) ? surfaceBg : surfaceAlt, border: `1.5px solid ${(focused || isOpen) ? focusColor : "transparent"}`, boxShadow: (focused || isOpen) ? `0 0 0 3px ${focusColor}22` : "none" };
                case "underline":
                    return { ...base, borderRadius: 0, background: "transparent", border: "none", borderBottom: `2px solid ${borderVal}`, overflow: "visible", boxShadow: "none" };
                case "ghost":
                    return { ...base, background: (focused || isOpen) ? surfaceAlt : "transparent", border: "none" };
                default:
                    return { ...base, background: disabled ? surfaceAlt : surfaceBg, border: `1.5px solid ${borderVal}`, boxShadow: (focused || isOpen) ? `0 0 0 3px ${focusColor}22` : "none" };
            }
        })();

        // ─────────────────────────────────────────────────────────────────────
        return (
            <div
                className={className}
                style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}
            >
                {/* Label */}
                {label && (
                    <label
                        htmlFor={id}
                        style={{
                            fontSize: font - 1,
                            fontWeight: 500,
                            color: (focused || isOpen) ? focusColor : textColor,
                            userSelect: "none",
                            cursor: "default",
                            transition: "color 0.15s",
                        }}
                    >
                        {label}
                    </label>
                )}

                {/* Input + dropdown container */}
                <div ref={containerRef} style={{ position: "relative", width: "100%" }}>

                    {/* Input wrapper */}
                    <div style={wrapperStyle}>
                        {/* Search icon */}
                        <span style={{ paddingLeft: px, display: "inline-flex", flexShrink: 0, color: (focused || isOpen) ? focusColor : mutedColor, transition: "color 0.15s" }}>
                            <SearchIcon size={iconSize - 2} color="currentColor" />
                        </span>

                        {/* Native input */}
                        <input
                            ref={mergedRef}
                            id={id}
                            name={name}
                            type="text"
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={isOpen}
                            aria-haspopup="listbox"
                            aria-invalid={hasError}
                            aria-activedescendant={isOpen && flatFiltered[highlightIdx] ? `${id}-opt-${highlightIdx}` : undefined}
                            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
                            value={inputValue}
                            placeholder={placeholder}
                            disabled={disabled}
                            readOnly={readOnly}
                            autoComplete="off"
                            onChange={handleInputChange}
                            onFocus={() => { setFocused(true); openDropdown(); }}
                            onBlur={() => { setFocused(false); }}
                            onKeyDown={handleKeyDown}
                            onClick={openDropdown}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: font,
                                color: disabled ? mutedColor : textColor,
                                padding: `0 ${px * 0.5}px`,
                                cursor: disabled ? "not-allowed" : readOnly ? "default" : "text",
                            }}
                        />

                        {/* Right icons row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 2, paddingRight: px * 0.6, flexShrink: 0 }}>
                            {/* Loading spinner */}
                            {loading && <Spinner size={iconSize} color={accentColor} />}

                            {/* Status icons */}
                            {!loading && effectiveStatus === "error" && (
                                <ErrorIcon size={iconSize} color={dangerColor} />
                            )}
                            {!loading && effectiveStatus === "success" && (
                                <SuccessIcon size={iconSize} color={successColor} />
                            )}

                            {/* Clear button */}
                            {allowClear && hasValue && !disabled && !readOnly && !loading && (
                                <span
                                    onClick={handleClear}
                                    style={{ display: "inline-flex", cursor: "pointer", color: mutedColor, transition: "color 0.12s", borderRadius: "50%", padding: 2 }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = dangerColor}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = mutedColor}
                                    aria-label="Clear"
                                >
                                    <XIcon size={iconSize - 2} color="currentColor" />
                                </span>
                            )}

                            {/* Chevron */}
                            {!loading && (
                                <span
                                    onClick={() => !disabled && !readOnly && (isOpen ? closeDropdown() : openDropdown())}
                                    style={{ display: "inline-flex", cursor: disabled ? "not-allowed" : "pointer" }}
                                >
                                    <ChevronDown size={iconSize} color={isOpen ? focusColor : mutedColor} open={isOpen} />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dropdown */}
                    {isOpen && !disabled && (
                        <div
                            role="listbox"
                            aria-label={label ?? "Options"}
                            style={{
                                position: "absolute",
                                top: "calc(100% + 6px)",
                                left: 0,
                                zIndex: 1000,
                                width: "100%",
                                background: surfaceBg,
                                border: `1.5px solid ${borderColor}`,
                                borderRadius: dropRadius,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.07)",
                                overflow: "hidden",
                                animation: "acDropIn 0.15s ease",
                            }}
                        >
                            <ul
                                ref={listRef}
                                style={{
                                    listStyle: "none",
                                    margin: 0,
                                    padding: 0,
                                    maxHeight: maxDropdownHeight,
                                    overflowY: "auto",
                                }}
                            >
                                {/* Loading state */}
                                {loading && (
                                    <li style={{ padding: `${optPy * 1.5}px ${px}px`, fontSize: font - 1, color: mutedColor, display: "flex", alignItems: "center", gap: 8 }}>
                                        <Spinner size={font} color={accentColor} /> {loadingText}
                                    </li>
                                )}

                                {/* No options */}
                                {!loading && flatFiltered.length === 0 && (
                                    <li style={{ padding: `${optPy * 1.5}px ${px}px`, fontSize: font - 1, color: mutedColor, textAlign: "center" }}>
                                        {/* freeSolo hint */}
                                        {freeSolo && inputValue
                                            ? <span>Press <kbd style={{ background: surfaceAlt, border: `1px solid ${borderColor}`, borderRadius: 3, padding: "1px 5px", fontSize: font - 2 }}>Enter</kbd> to add "{inputValue}"</span>
                                            : noOptionsText
                                        }
                                    </li>
                                )}

                                {/* Grouped options */}
                                {!loading && grouped && Object.entries(grouped).map(([groupLabel, groupOpts]) => (
                                    <React.Fragment key={groupLabel}>
                                        {/* Group header */}
                                        <li style={{
                                            padding: `${optPy * 0.6}px ${px}px ${optPy * 0.3}px`,
                                            fontSize: font - 3,
                                            fontWeight: 700,
                                            color: mutedColor,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            background: surfaceAlt,
                                            borderBottom: `1px solid ${borderColor}`,
                                        }}>
                                            {groupLabel}
                                        </li>
                                        {groupOpts.map(opt => {
                                            const flatIdx = flatFiltered.indexOf(opt);
                                            const isSelected = selected?.value === opt.value;
                                            const isHighlight = flatIdx === highlightIdx;
                                            return (
                                                <OptionRow
                                                    key={opt.value}
                                                    opt={opt}
                                                    idx={flatIdx}
                                                    id={`${id}-opt-${flatIdx}`}
                                                    isSelected={isSelected}
                                                    isHighlight={isHighlight}
                                                    inputValue={inputValue}
                                                    onSelect={handleSelect}
                                                    onHover={setHighlightIdx}
                                                    accentColor={accentColor}
                                                    textColor={textColor}
                                                    mutedColor={mutedColor}
                                                    surfaceBg={surfaceBg}
                                                    font={font}
                                                    px={px}
                                                    optPy={optPy}
                                                    renderOption={renderOption}
                                                />
                                            );
                                        })}
                                    </React.Fragment>
                                ))}

                                {/* Flat options */}
                                {!loading && !grouped && filteredOptions.map((opt, idx) => {
                                    const isSelected = selected?.value === opt.value;
                                    const isHighlight = idx === highlightIdx;
                                    return (
                                        <OptionRow
                                            key={opt.value}
                                            opt={opt}
                                            idx={idx}
                                            id={`${id}-opt-${idx}`}
                                            isSelected={isSelected}
                                            isHighlight={isHighlight}
                                            inputValue={inputValue}
                                            onSelect={handleSelect}
                                            onHover={setHighlightIdx}
                                            accentColor={accentColor}
                                            textColor={textColor}
                                            mutedColor={mutedColor}
                                            surfaceBg={surfaceBg}
                                            font={font}
                                            px={px}
                                            optPy={optPy}
                                            renderOption={renderOption}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Error */}
                {hasError && (
                    <p id={`${id}-error`} role="alert"
                        style={{ fontSize: font - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
                        {error}
                    </p>
                )}

                {/* Helper */}
                {!hasError && helperText && (
                    <p id={`${id}-helper`}
                        style={{ fontSize: font - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
                        {helperText}
                    </p>
                )}

                <style>{`
                    @keyframes acDropIn {
                        from { opacity: 0; transform: translateY(-6px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes acSpin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }
);

Autocomplete.displayName = "Autocomplete";

// ─── Option Row ───────────────────────────────────────────────────────────────

interface OptionRowProps {
    opt: AutocompleteOption;
    idx: number;
    id: string;
    isSelected: boolean;
    isHighlight: boolean;
    inputValue: string;
    onSelect: (opt: AutocompleteOption) => void;
    onHover: (idx: number) => void;
    accentColor: string;
    textColor: string;
    mutedColor: string;
    surfaceBg: string;
    font: number;
    px: number;
    optPy: number;
    renderOption?: (opt: AutocompleteOption, isSelected: boolean, isHighlighted: boolean) => React.ReactNode;
}

const OptionRow = ({
    opt, idx, id, isSelected, isHighlight, inputValue,
    onSelect, onHover,
    accentColor, textColor, mutedColor, surfaceBg,
    font, px, optPy, renderOption,
}: OptionRowProps) => (
    <li
        id={id}
        data-idx={idx}
        role="option"
        aria-selected={isSelected}
        aria-disabled={opt.disabled}
        onClick={() => !opt.disabled && onSelect(opt)}
        onMouseEnter={() => onHover(idx)}
        style={{
            display: "flex",
            alignItems: opt.description ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 8,
            padding: `${optPy}px ${px}px`,
            cursor: opt.disabled ? "not-allowed" : "pointer",
            opacity: opt.disabled ? 0.45 : 1,
            background: isHighlight
                ? `${accentColor}10`
                : isSelected
                    ? `${accentColor}08`
                    : surfaceBg,
            borderLeft: isSelected ? `3px solid ${accentColor}` : "3px solid transparent",
            transition: "background 0.1s",
        }}
    >
        {renderOption ? renderOption(opt, isSelected, isHighlight) : (
            <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    {/* Icon */}
                    {opt.icon && (
                        <span style={{ display: "inline-flex", flexShrink: 0, color: isSelected ? accentColor : mutedColor, transition: "color 0.15s" }}>
                            {opt.icon}
                        </span>
                    )}
                    {/* Label + description */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                        <span style={{
                            fontSize: font - 1,
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? accentColor : textColor,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            <HighlightMatch text={opt.label} query={inputValue} color={accentColor} />
                        </span>
                        {opt.description && (
                            <span style={{ fontSize: font - 3, color: mutedColor, lineHeight: 1.3 }}>
                                {opt.description}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {/* Badge */}
                    {opt.badge && (() => {
                        const bc = opt.badgeColor ?? (isSelected ? accentColor : mutedColor);
                        return (
                            <span style={{
                                fontSize: font - 3,
                                fontWeight: 700,
                                color: bc,
                                background: `${bc}1a`,
                                border: `1px solid ${bc}55`,
                                borderRadius: 9999,
                                padding: `1px ${font - 2}px`,
                                whiteSpace: "nowrap",
                            }}>
                                {opt.badge}
                            </span>
                        );
                    })()}
                    {/* Checkmark */}
                    {isSelected && <CheckIcon size={font} color={accentColor} />}
                </div>
            </>
        )}
    </li>
);


// Example usage:

// Basic
{/* <Autocomplete
    label="City"
    placeholder="Search city..."
    options={[
        { label: "Chennai", value: "chennai" },
        { label: "Mumbai",  value: "mumbai"  },
        { label: "Delhi",   value: "delhi"   },
    ]}
    value={selected}
    onChange={(opt) => setSelected(opt)}
/> */}

// With description + icon + badge
{/* <Autocomplete
    label="Meal Type"
    options={[
        { label: "Veg", value: "veg", description: "Plant based", icon: <LeafIcon />, badge: "Healthy" },
        { label: "Non-Veg", value: "nonveg", description: "Includes meat", icon: <DrumstickIcon /> },
    ]}
    value={selected} onChange={setSelected}
/> */}

// Grouped options
{/* <Autocomplete
    label="Food"
    groupBy={(opt) => opt.group ?? "Other"}
    options={[
        { label: "Idli",   value: "idli",   group: "South Indian" },
        { label: "Dosa",   value: "dosa",   group: "South Indian" },
        { label: "Butter Chicken", value: "bc", group: "North Indian" },
    ]}
    value={selected} onChange={setSelected}
/> */}

// Async search
{/* <Autocomplete
    label="Users"
    options={results}
    loading={isLoading}
    onInputChange={(q) => fetchUsers(q)}
    value={selected} onChange={setSelected}
/> */}

// Free solo (accept custom values)
{/* <Autocomplete
    label="Tag"
    freeSolo
    options={existingTags}
    value={selected} onChange={setSelected}
/> */}

// Sizes & Variants
{/* <Autocomplete size="sm" variant="filled"    options={opts} value={v} onChange={setV} /> */ }
{/* <Autocomplete size="lg" variant="underline" options={opts} value={v} onChange={setV} /> */ }

// Custom option renderer
{/* <Autocomplete
    options={opts} value={v} onChange={setV}
    renderOption={(opt, isSelected, isHighlighted) => (
        <div style={{ padding: "8px 12px", color: isSelected ? "blue" : "black" }}>
            ★ {opt.label}
        </div>
    )}
/> */}

// Error state
{/* <Autocomplete error="Please select a city" options={opts} value={null} onChange={setV} /> */ }