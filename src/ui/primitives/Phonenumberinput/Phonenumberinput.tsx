import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
    type CSSProperties,
    type InputHTMLAttributes,
    type KeyboardEvent,
} from "react";
import { useTheme } from "../../theme/ThemeContext";
import { findCountryByIso2, SORTED_COUNTRIES, type Country } from "./Countrydata";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";

export interface PhoneNumberInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
    /** Controlled phone number value (digits only, no dial code) */
    value?: string;
    /** Default uncontrolled value */
    defaultValue?: string;
    /** Fires with { phoneNumber, dialCode, iso2, fullNumber } */
    onChange?: (data: PhoneChangeData) => void;
    /** Default country ISO2 code. Default: "US" */
    defaultCountry?: string;
    /** Controlled selected country ISO2 */
    country?: string;
    /** Fires when country selection changes */
    onCountryChange?: (country: Country) => void;
    /** Show the country flag emoji */
    showFlag?: boolean;
    /** Show the +dialCode label in the trigger */
    showDialCode?: boolean;
    /** Apply phone mask from country data */
    enableMask?: boolean;
    /** Input size */
    size?: Size;
    /** Visual variant */
    variant?: Variant;
    /** Validation status */
    status?: Status;
    /** Helper / error message shown below */
    helperText?: string;
    /** Input label */
    label?: string;
    /** Placeholder text (defaults to mask or "Enter phone number") */
    placeholder?: string;
    /** Disable the whole component */
    disabled?: boolean;
    /** Make country selector read-only (phone input still works) */
    countryReadOnly?: boolean;
    /** Max digits allowed (default: 15 per E.164) */
    maxDigits?: number;
    /** Show a clear button when there is a value */
    allowClear?: boolean;
    /** Custom search placeholder inside dropdown */
    searchPlaceholder?: string;
}

export interface PhoneChangeData {
    phoneNumber: string;   // Local digits only
    dialCode: string;   // e.g. "+91"
    iso2: string;   // e.g. "IN"
    fullNumber: string;   // e.g. "+919876543210"
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, { h: number; font: number; flagFont: number; pad: number; radius: number }> = {
    sm: { h: 32, font: 12, flagFont: 16, pad: 8, radius: 6 },
    md: { h: 40, font: 14, flagFont: 20, pad: 12, radius: 8 },
    lg: { h: 48, font: 15, flagFont: 24, pad: 14, radius: 10 },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronDown = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const SearchIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const ClearIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CheckIcon = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ─── Mask helper ──────────────────────────────────────────────────────────────

function applyMask(digits: string, mask?: string): string {
    if (!mask) return digits;
    let di = 0;
    let result = "";
    for (let i = 0; i < mask.length && di < digits.length; i++) {
        if (mask[i] === "9") {
            result += digits[di++];
        } else {
            result += mask[i];
        }
    }
    return result;
}

function stripNonDigits(val: string): string {
    return val.replace(/\D/g, "");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cx(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// ─── PhoneNumberInput ─────────────────────────────────────────────────────────

export const PhoneNumberInput = ({
    value,
    defaultValue = "",
    onChange,
    defaultCountry = "US",
    country: countryProp,
    onCountryChange,
    showFlag = true,
    showDialCode = true,
    enableMask = true,
    size = "md",
    variant = "outline",
    status = "default",
    helperText,
    label,
    placeholder,
    disabled = false,
    countryReadOnly = false,
    maxDigits = 15,
    allowClear = true,
    searchPlaceholder = "Search country...",
    className = "",
    ...rest
}: PhoneNumberInputProps) => {
    const { theme } = useTheme();
    const c = theme.colors;

    // ── Sizing ────────────────────────────────────────────────────────────────
    const { h, font, flagFont, pad, radius } = sizeMap[size];

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
    const statusBorderMap: Record<Status, string> = {
        default: borderColor,
        error: dangerColor,
        success: successColor,
        warning: warningColor,
    };

    // ── Country state ─────────────────────────────────────────────────────────
    const isCountryControlled = countryProp !== undefined;
    const [internalCountryIso, setInternalCountryIso] = useState<string>(
        () => findCountryByIso2(defaultCountry)?.iso2 ?? "US"
    );
    const selectedIso = isCountryControlled
        ? (countryProp ?? "US")
        : internalCountryIso;
    const selectedCountry = findCountryByIso2(selectedIso) ?? SORTED_COUNTRIES[0];

    // ── Phone state ───────────────────────────────────────────────────────────
    const isPhoneControlled = value !== undefined;
    const [internalPhone, setInternalPhone] = useState(defaultValue);
    const phoneDigits = isPhoneControlled ? (value ?? "") : internalPhone;

    // ── Dropdown state ────────────────────────────────────────────────────────
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Filter countries ──────────────────────────────────────────────────────
    const filteredCountries = useMemo(() => {
        if (!search.trim()) return SORTED_COUNTRIES;
        const q = search.toLowerCase();
        return SORTED_COUNTRIES.filter(
            (co: any) =>
                co.name.toLowerCase().includes(q) ||
                co.dialCode.includes(q) ||
                co.iso2.toLowerCase().includes(q)
        );
    }, [search]);

    // ── Close on outside click ────────────────────────────────────────────────
    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [dropdownOpen]);

    // ── Focus search on open ──────────────────────────────────────────────────
    useEffect(() => {
        if (dropdownOpen) {
            setTimeout(() => searchRef.current?.focus(), 50);
            setHighlightIdx(
                Math.max(0, filteredCountries.findIndex((co: any) => co.iso2 === selectedIso))
            );
        }
    }, [dropdownOpen]);

    // ── Scroll highlighted item into view ─────────────────────────────────────
    useEffect(() => {
        if (!dropdownRef.current) return;
        const el = dropdownRef.current.querySelector(`[data-idx="${highlightIdx}"]`) as HTMLElement;
        el?.scrollIntoView({ block: "nearest" });
    }, [highlightIdx]);

    // ── Select country ────────────────────────────────────────────────────────
    const selectCountry = useCallback((co: Country) => {
        if (!isCountryControlled) setInternalCountryIso(co.iso2);
        onCountryChange?.(co);
        setDropdownOpen(false);
        setSearch("");
        inputRef.current?.focus();
        // Re-fire onChange with new dial code
        onChange?.({
            phoneNumber: phoneDigits,
            dialCode: co.dialCode,
            iso2: co.iso2,
            fullNumber: `${co.dialCode}${phoneDigits}`,
        });
    }, [isCountryControlled, onCountryChange, onChange, phoneDigits]);

    // ── Handle phone input ────────────────────────────────────────────────────
    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = stripNonDigits(e.target.value);
        const digits = raw.slice(0, maxDigits);
        if (!isPhoneControlled) setInternalPhone(digits);
        onChange?.({
            phoneNumber: digits,
            dialCode: selectedCountry.dialCode,
            iso2: selectedCountry.iso2,
            fullNumber: `${selectedCountry.dialCode}${digits}`,
        });
    }, [isPhoneControlled, maxDigits, onChange, selectedCountry]);

    // ── Clear ─────────────────────────────────────────────────────────────────
    const handleClear = useCallback(() => {
        if (!isPhoneControlled) setInternalPhone("");
        onChange?.({
            phoneNumber: "",
            dialCode: selectedCountry.dialCode,
            iso2: selectedCountry.iso2,
            fullNumber: selectedCountry.dialCode,
        });
        inputRef.current?.focus();
    }, [isPhoneControlled, onChange, selectedCountry]);

    // ── Dropdown keyboard ─────────────────────────────────────────────────────
    const handleDropdownKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIdx((i) => Math.min(i + 1, filteredCountries.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredCountries[highlightIdx]) selectCountry(filteredCountries[highlightIdx]);
        } else if (e.key === "Escape") {
            setDropdownOpen(false);
            setSearch("");
        }
    }, [filteredCountries, highlightIdx, selectCountry]);

    // ── Displayed value ───────────────────────────────────────────────────────
    const displayValue = enableMask && selectedCountry.mask
        ? applyMask(phoneDigits, selectedCountry.mask)
        : phoneDigits;

    const resolvedPlaceholder = placeholder ??
        (enableMask && selectedCountry.mask
            ? selectedCountry.mask.replace(/9/g, "0")
            : "Enter phone number");

    // ── Variant styles ────────────────────────────────────────────────────────
    const focusColor = statusColorMap[status];
    const borderVal = focused ? focusColor : statusBorderMap[status];

    const containerStyle: CSSProperties = (() => {
        const base: CSSProperties = {
            display: "flex",
            alignItems: "center",
            height: h,
            borderRadius: radius,
            overflow: "hidden",
            transition: "box-shadow 0.15s, border-color 0.15s",
            cursor: disabled ? "not-allowed" : "default",
            opacity: disabled ? 0.6 : 1,
        };
        switch (variant) {
            case "filled":
                return {
                    ...base,
                    background: focused ? bgColor : surfaceBg,
                    border: `1.5px solid ${focused ? focusColor : "transparent"}`,
                    boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none",
                };
            case "underline":
                return {
                    ...base,
                    borderRadius: 0,
                    background: "transparent",
                    borderBottom: `2px solid ${borderVal}`,
                    boxShadow: "none",
                };
            case "ghost":
                return {
                    ...base,
                    background: focused ? surfaceBg : "transparent",
                    border: "none",
                };
            default: // outline
                return {
                    ...base,
                    background: bgColor,
                    border: `1.5px solid ${borderVal}`,
                    boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none",
                };
        }
    })();

    // ── Trigger (left section) style ──────────────────────────────────────────
    const triggerStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: `0 ${pad * 0.75}px 0 ${pad}px`,
        height: "100%",
        flexShrink: 0,
        cursor: disabled || countryReadOnly ? "not-allowed" : "pointer",
        borderRight: variant !== "underline" ? `1px solid ${borderColor}` : "none",
        background: "transparent",
        transition: "background 0.12s",
        userSelect: "none",
        whiteSpace: "nowrap",
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={cx("w-full", className)} style={{ position: "relative" }}>
            {/* Label */}
            {label && (
                <label
                    style={{
                        display: "block",
                        fontSize: font - 1,
                        fontWeight: 500,
                        color: focused ? focusColor : textColor,
                        marginBottom: 4,
                        transition: "color 0.15s",
                        userSelect: "none",
                    }}
                >
                    {label}
                </label>
            )}

            {/* Input wrapper */}
            <div ref={wrapperRef} style={{ position: "relative" }}>
                <div style={containerStyle}>

                    {/* Country selector trigger */}
                    <button
                        type="button"
                        aria-label={`Select country, current: ${selectedCountry.name}`}
                        aria-haspopup="listbox"
                        aria-expanded={dropdownOpen}
                        disabled={disabled || countryReadOnly}
                        onClick={() => {
                            if (disabled || countryReadOnly) return;
                            setDropdownOpen((v) => !v);
                        }}
                        style={triggerStyle}
                        onMouseEnter={(e) => {
                            if (!disabled && !countryReadOnly)
                                (e.currentTarget as HTMLElement).style.background = `${accentColor}10`;
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                    >
                        {showFlag && (
                            <span
                                style={{ fontSize: flagFont, lineHeight: 1 }}
                                role="img"
                                aria-label={selectedCountry.name}
                            >
                                {selectedCountry.flag}
                            </span>
                        )}
                        {showDialCode && (
                            <span style={{ fontSize: font, color: textColor, fontWeight: 500 }}>
                                {selectedCountry.dialCode}
                            </span>
                        )}
                        {!countryReadOnly && (
                            <ChevronDown
                                size={font}
                                color={mutedColor}
                            />
                        )}
                    </button>

                    {/* Phone input */}
                    <input
                        {...rest}
                        ref={inputRef}
                        type="tel"
                        inputMode="numeric"
                        value={displayValue}
                        onChange={handlePhoneChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={resolvedPlaceholder}
                        disabled={disabled}
                        aria-label={label ?? "Phone number"}
                        aria-invalid={status === "error"}
                        style={{
                            flex: 1,
                            height: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: font,
                            color: textColor,
                            padding: `0 ${pad}px`,
                            minWidth: 0,
                            cursor: disabled ? "not-allowed" : "text",
                            letterSpacing: "0.02em",
                        }}
                    />

                    {/* Clear button */}
                    {allowClear && phoneDigits.length > 0 && !disabled && (
                        <button
                            type="button"
                            aria-label="Clear phone number"
                            onClick={handleClear}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: h * 0.7,
                                height: h * 0.7,
                                borderRadius: "50%",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                marginRight: pad * 0.5,
                                flexShrink: 0,
                                color: mutedColor,
                                transition: "background 0.12s, color 0.12s",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = `${dangerColor}15`;
                                (e.currentTarget as HTMLElement).style.color = dangerColor;
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = mutedColor;
                            }}
                        >
                            <ClearIcon size={font} color="currentColor" />
                        </button>
                    )}

                    {/* Status icon */}
                    {status === "success" && phoneDigits.length > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", marginRight: pad * 0.5, flexShrink: 0 }}>
                            <CheckIcon size={font + 2} color={successColor} />
                        </span>
                    )}
                </div>

                {/* Dropdown */}
                {dropdownOpen && (
                    <div
                        role="listbox"
                        aria-label="Select country"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            zIndex: 999,
                            width: "max(100%, 280px)",
                            background: bgColor,
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: radius + 2,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                            overflow: "hidden",
                            animation: "phoneDropIn 0.15s ease",
                        }}
                    >
                        {/* Search */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: `${pad * 0.6}px ${pad}px`,
                            borderBottom: `1px solid ${borderColor}`,
                            background: surfaceBg,
                        }}>
                            <SearchIcon size={font + 2} color={mutedColor} />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setHighlightIdx(0);
                                }}
                                onKeyDown={handleDropdownKey}
                                aria-label="Search countries"
                                style={{
                                    flex: 1,
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    fontSize: font - 1,
                                    color: textColor,
                                }}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                                    style={{ border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", padding: 0 }}
                                    aria-label="Clear search"
                                >
                                    <ClearIcon size={font - 2} color={mutedColor} />
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div
                            ref={dropdownRef}
                            style={{ maxHeight: 240, overflowY: "auto" }}
                        >
                            {filteredCountries.length === 0 ? (
                                <div style={{ padding: `${pad}px`, fontSize: font - 1, color: mutedColor, textAlign: "center" }}>
                                    No countries found
                                </div>
                            ) : (
                                filteredCountries.map((co: any, idx: any) => {
                                    const isSelected = co.iso2 === selectedIso;
                                    const isHighlight = idx === highlightIdx;
                                    return (
                                        <div
                                            key={`${co.iso2}-${co.dialCode}`}
                                            role="option"
                                            aria-selected={isSelected}
                                            data-idx={idx}
                                            onClick={() => selectCountry(co)}
                                            onMouseEnter={() => setHighlightIdx(idx)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                padding: `${pad * 0.55}px ${pad}px`,
                                                cursor: "pointer",
                                                background: isHighlight
                                                    ? `${accentColor}12`
                                                    : isSelected
                                                        ? `${accentColor}08`
                                                        : "transparent",
                                                fontSize: font - 1,
                                                color: textColor,
                                                transition: "background 0.1s",
                                                borderLeft: isSelected
                                                    ? `3px solid ${accentColor}`
                                                    : "3px solid transparent",
                                            }}
                                        >
                                            {/* Flag */}
                                            <span style={{ fontSize: flagFont * 0.8, lineHeight: 1, flexShrink: 0 }}
                                                role="img" aria-label={co.name}>
                                                {co.flag}
                                            </span>

                                            {/* Country name */}
                                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {co.name}
                                            </span>

                                            {/* Dial code */}
                                            <span style={{ color: mutedColor, fontWeight: 500, flexShrink: 0 }}>
                                                {co.dialCode}
                                            </span>

                                            {/* Selected tick */}
                                            {isSelected && (
                                                <CheckIcon size={font} color={accentColor} />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Helper / Error text */}
            {helperText && (
                <p style={{
                    marginTop: 4,
                    fontSize: font - 2,
                    color: status === "error" ? dangerColor
                        : status === "success" ? successColor
                            : status === "warning" ? warningColor
                                : mutedColor,
                    lineHeight: 1.4,
                }}>
                    {helperText}
                </p>
            )}

            {/* Keyframe for dropdown */}
            <style>{`
                @keyframes phoneDropIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
            `}</style>
        </div>
    );
};

//Example usage:
// Basic
{/* <PhoneNumberInput label="Phone Number" onChange={(d) => console.log(d.fullNumber)} /> */ }

// Controlled
{/* <PhoneNumberInput
    value={phone}
    country="IN"
    onChange={(d) => setPhone(d.phoneNumber)}
    onCountryChange={(c) => console.log(c.name)}
    label="Mobile"
    showFlag
    showDialCode
    enableMask
/> */}

// Validation states
{/* <PhoneNumberInput status="error"   helperText="Invalid phone number" /> */ }
{/* <PhoneNumberInput status="success" helperText="Phone verified ✓" /> */ }

// Variants
{/* <PhoneNumberInput variant="filled"    label="Filled style" /> */ }
{/* <PhoneNumberInput variant="underline" label="Underline style" /> */ }

// Locked country (e.g. regional app)
{/* <PhoneNumberInput defaultCountry="IN" countryReadOnly label="India only" /> */ }