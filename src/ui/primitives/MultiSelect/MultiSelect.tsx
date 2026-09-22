import React, {
  useId, useRef, useState, useEffect, useCallback,
  type CSSProperties, type KeyboardEvent,
} from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { X, ChevronDown, Search, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** Controlled selected values */
  value?: string[];
  /** Default selected values (uncontrolled) */
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  label?: string;
  name?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  status?: Status;
  size?: Size;
  variant?: Variant;
  /** Single select mode - behaves like a styled <select> */
  singleSelect?: boolean;
  /** Enable search input inside dropdown */
  searchable?: boolean;
  /** Show a "Select All" option */
  showSelectAll?: boolean;
  /** Max selections allowed */
  maxSelection?: number;
  /** Max tags shown before "+N more" collapse */
  maxTagsVisible?: number;
  disabled?: boolean;
  /** Closes dropdown after each selection (useful for singleSelect) */
  closeOnSelect?: boolean;
  searchPlaceholder?: string;
  className?: string;
  required?: boolean;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  minH: number; font: number; tagFont: number;
  px: number; py: number; radius: number;
  iconSize: number; tagPy: number; tagPx: number; tagRadius: number;
  dropRadius: number; optPy: number;
}> = {
  sm: { minH: 32, font: 12, tagFont: 11, px: 10, py: 5, radius: 6, iconSize: 14, tagPy: 1, tagPx: 6, tagRadius: 9999, dropRadius: 6, optPy: 6 },
  md: { minH: 40, font: 14, tagFont: 12, px: 12, py: 8, radius: 8, iconSize: 16, tagPy: 2, tagPx: 8, tagRadius: 9999, dropRadius: 8, optPy: 8 },
  lg: { minH: 48, font: 15, tagFont: 13, px: 14, py: 10, radius: 10, iconSize: 18, tagPy: 3, tagPx: 10, tagRadius: 9999, dropRadius: 10, optPy: 10 },
};

// ─── MultiSelect ──────────────────────────────────────────────────────────────

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      value,
      defaultValue = [],
      onChange,
      label,
      name,
      placeholder = "Select...",
      error,
      helperText,
      status = "default",
      size = "md",
      variant = "outline",
      singleSelect = false,
      searchable = true,
      showSelectAll = false,
      maxSelection,
      maxTagsVisible = 3,
      disabled = false,
      closeOnSelect = false,
      searchPlaceholder = "Search...",
      className = "",
      required = false,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const autoId = useId();
    const id = name ?? autoId;

    // ── State ─────────────────────────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<string[]>(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [focused, setFocused] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);

    const selected = isControlled ? (value ?? []) : internal;

    const setSelected = useCallback((next: string[]) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    }, [isControlled, onChange]);

    // ── Refs ──────────────────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Close on outside click ────────────────────────────────────────────
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setIsOpen(false);
          setSearch("");
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // ── Focus search on open ──────────────────────────────────────────────
    useEffect(() => {
      if (isOpen && searchable) {
        setTimeout(() => searchRef.current?.focus(), 30); // ✅ prevents focus loss on re-render
      }
    }, [isOpen, searchable]);

    // ── Scroll highlighted item into view ─────────────────────────────────
    useEffect(() => {
      if (!dropdownRef.current) return;
      const el = dropdownRef.current.querySelector(`[data-idx="${highlightIdx}"]`) as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }, [highlightIdx]);

    // ── Filtered options ──────────────────────────────────────────────────
    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.description?.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOptions = options.filter(opt => selected.includes(opt.value));
    const isMaxReached = !!maxSelection && selected.length >= maxSelection;

    // ── Toggle option ─────────────────────────────────────────────────────
    const handleSelect = useCallback((val: string) => {
      if (singleSelect) {
        setSelected([val]);
        setIsOpen(false);
        setSearch("");
        return;
      }
      const isAlreadySelected = selected.includes(val);
      if (!isAlreadySelected && isMaxReached) return;
      const next = isAlreadySelected
        ? selected.filter(v => v !== val)
        : [...selected, val];
      setSelected(next);
      if (closeOnSelect) { setIsOpen(false); setSearch(""); }
    }, [singleSelect, selected, isMaxReached, closeOnSelect, setSelected]);

    // ── Remove tag ────────────────────────────────────────────────────────
    const handleRemove = (val: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelected(selected.filter(v => v !== val));
    };

    // ── Select all ────────────────────────────────────────────────────────
    const enabledOptions = options.filter(o => !o.disabled);
    const allSelected = enabledOptions.length > 0 && enabledOptions.every(o => selected.includes(o.value));

    const handleSelectAll = () => {
      if (allSelected) {
        setSelected([]);
      } else {
        const all = enabledOptions.map(o => o.value);
        const next = maxSelection ? all.slice(0, maxSelection) : all;
        setSelected(next);
      }
    };

    // ── Keyboard nav ──────────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        if (!isOpen) { setIsOpen(true); return; }
        if (filteredOptions[highlightIdx]) handleSelect(filteredOptions[highlightIdx].value);
      }
      if (e.key === "Escape") { setIsOpen(false); setSearch(""); }
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, filteredOptions.length - 1)); if (!isOpen) setIsOpen(true); }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Backspace" && search === "" && selected.length > 0 && !singleSelect) {
        setSelected(selected.slice(0, -1));
      }
    };

    const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, filteredOptions.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { if (filteredOptions[highlightIdx]) handleSelect(filteredOptions[highlightIdx].value); }
      if (e.key === "Escape") { setIsOpen(false); setSearch(""); }
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
      default: accentColor, error: dangerColor, success: successColor, warning: warningColor,
    };
    const statusBorderMap: Record<Status, string> = {
      default: borderColor, error: dangerColor, success: successColor, warning: warningColor,
    };

    const focusColor = statusColorMap[effectiveStatus];
    const borderVal = (focused || isOpen) ? focusColor : statusBorderMap[effectiveStatus];

    const {
      minH, font, tagFont, px, py, radius,
      iconSize, tagPy, tagPx, tagRadius, dropRadius, optPy,
    } = sizeMap[size];

    const hasError = !!error;

    // ── Trigger wrapper style (variant-driven) ────────────────────────────
    const triggerStyle: CSSProperties = (() => {
      const base: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: minH,
        width: "100%",
        padding: `${py}px ${px}px`,
        borderRadius: radius,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "box-shadow 0.15s, border-color 0.15s, background 0.15s",
        gap: 8,
        boxSizing: "border-box" as const,
        userSelect: "none",
      };
      switch (variant) {
        case "filled":
          return { ...base, background: (focused || isOpen) ? surfaceBg : surfaceAlt, border: `1.5px solid ${(focused || isOpen) ? focusColor : "transparent"}`, boxShadow: (focused || isOpen) ? `0 0 0 3px ${focusColor}22` : "none" };
        case "underline":
          return { ...base, borderRadius: 0, background: "transparent", border: "none", borderBottom: `2px solid ${borderVal}`, padding: `${py}px 0`, boxShadow: "none" };
        case "ghost":
          return { ...base, background: (focused || isOpen) ? surfaceAlt : "transparent", border: "none" };
        default:
          return { ...base, background: disabled ? surfaceAlt : surfaceBg, border: `1.5px solid ${borderVal}`, boxShadow: (focused || isOpen) ? `0 0 0 3px ${focusColor}22` : "none" };
      }
    })();

    // ── Tags to show ──────────────────────────────────────────────────────
    const visibleTags = selectedOptions.slice(0, maxTagsVisible);
    const overflowCount = selectedOptions.length - maxTagsVisible;

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        ref={ref}
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
              transition: "color 0.15s",
              cursor: "default",
            }}
          >
            {label}
            {required && (
              <span style={{ color: textColor, marginLeft: 4 }}>*</span>
            )}
            {maxSelection && (
              <span style={{ fontSize: font - 2, fontWeight: 400, color: mutedColor, marginLeft: 6 }}>
                (max {maxSelection})
              </span>
            )}
          </label>
        )}

        {/* Wrapper - handles outside click + keyboard */}
        <div
          ref={containerRef}
          style={{ position: "relative" }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-invalid={hasError}
          aria-disabled={disabled}
        >
          {/* Trigger */}
          <div
            style={triggerStyle}
            onClick={() => !disabled && setIsOpen(v => !v)}
          >
            {/* Tags / placeholder */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1, minWidth: 0 }}>
              {selectedOptions.length === 0 && (
                <span style={{ fontSize: font, color: mutedColor }}>
                  {placeholder}
                </span>
              )}

              {visibleTags.map(opt => (
                <span
                  key={opt.value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: tagFont,
                    fontWeight: 500,
                    color: accentColor,
                    background: `${accentColor}14`,
                    border: `1px solid ${accentColor}30`,
                    borderRadius: tagRadius,
                    padding: `${tagPy}px ${tagPx}px`,
                    maxWidth: "160px",
                    flexShrink: 0,
                  }}
                >
                  {opt.icon && (
                    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                  {!disabled && !singleSelect && (
                    <span
                      onClick={(e) => handleRemove(opt.value, e)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        color: accentColor,
                        opacity: 0.6,
                        transition: "opacity 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.6"}
                    >
                      <X size={tagFont} />
                    </span>
                  )}
                </span>
              ))}

              {/* Overflow badge */}
              {overflowCount > 0 && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: tagFont,
                  fontWeight: 600,
                  color: mutedColor,
                  background: `${borderColor}40`,
                  borderRadius: tagRadius,
                  padding: `${tagPy}px ${tagPx}px`,
                  flexShrink: 0,
                }}>
                  +{overflowCount}
                </span>
              )}
            </div>

            {/* Right icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {/* Clear all */}
              {selected.length > 0 && !disabled && !singleSelect && (
                <span
                  onClick={(e) => { e.stopPropagation(); setSelected([]); }}
                  style={{ display: "inline-flex", cursor: "pointer", color: mutedColor, transition: "color 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = dangerColor}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = mutedColor}
                  aria-label="Clear all"
                >
                  <X size={iconSize} />
                </span>
              )}
              <ChevronDown
                size={iconSize}
                color={isOpen ? focusColor : mutedColor}
                style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div
              ref={dropdownRef}
              role="listbox"
              aria-multiselectable={!singleSelect}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                zIndex: 1000,
                width: "100%",
                background: surfaceBg,
                border: `1.5px solid ${borderColor}`,
                borderRadius: dropRadius,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
                animation: "msDropIn 0.15s ease",
              }}
            >
              {/* Search */}
              {searchable && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: `${optPy * 0.75}px ${px}px`,
                  borderBottom: `1px solid ${borderColor}`,
                  background: surfaceAlt,
                }}>
                  <Search size={font} color={mutedColor} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    placeholder={searchPlaceholder}
                    onChange={(e) => { setSearch(e.target.value); setHighlightIdx(0); }}
                    onKeyDown={handleSearchKey}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: font - 1,
                      color: textColor,
                    }}
                    aria-label="Search options"
                  />
                  {search && (
                    <span onClick={() => setSearch("")} style={{ cursor: "pointer", display: "inline-flex", color: mutedColor }}>
                      <X size={font - 2} />
                    </span>
                  )}
                </div>
              )}

              {/* Select all */}
              {showSelectAll && !singleSelect && (
                <div
                  onClick={handleSelectAll}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: `${optPy}px ${px}px`,
                    cursor: "pointer",
                    borderBottom: `1px solid ${borderColor}`,
                    background: allSelected ? `${accentColor}08` : "transparent",
                    fontSize: font - 1,
                    fontWeight: 600,
                    color: allSelected ? accentColor : textColor,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!allSelected) (e.currentTarget as HTMLElement).style.background = `${accentColor}06`; }}
                  onMouseLeave={e => { if (!allSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span>Select all</span>
                  {allSelected && <Check size={font} color={accentColor} />}
                </div>
              )}

              {/* Options list */}
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {filteredOptions.length === 0 ? (
                  <div style={{ padding: `${optPy * 1.5}px ${px}px`, fontSize: font - 1, color: mutedColor, textAlign: "center" }}>
                    No results found
                  </div>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isSelected = selected.includes(opt.value);
                    const isHighlight = idx === highlightIdx;
                    const isDisabled = !!opt.disabled || (!isSelected && isMaxReached);

                    return (
                      <div
                        key={opt.value}
                        data-idx={idx}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isDisabled}
                        onClick={() => !isDisabled && handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        style={{
                          display: "flex",
                          alignItems: opt.description ? "flex-start" : "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: `${optPy}px ${px}px`,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          background: isHighlight
                            ? `${accentColor}10`
                            : isSelected
                              ? `${accentColor}08`
                              : "transparent",
                          opacity: isDisabled ? 0.45 : 1,
                          borderLeft: isSelected ? `3px solid ${accentColor}` : "3px solid transparent",
                          transition: "background 0.1s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          {opt.icon && (
                            <span style={{ display: "inline-flex", flexShrink: 0, color: isSelected ? accentColor : mutedColor }}>
                              {opt.icon}
                            </span>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                            <span style={{
                              fontSize: font - 1,
                              fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? accentColor : textColor,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span style={{ fontSize: font - 3, color: mutedColor }}>
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check size={font} color={accentColor} style={{ flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer - selection count */}
              {!singleSelect && selected.length > 0 && (
                <div style={{
                  padding: `${optPy * 0.6}px ${px}px`,
                  borderTop: `1px solid ${borderColor}`,
                  background: surfaceAlt,
                  fontSize: font - 2,
                  color: mutedColor,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span>
                    {selected.length}{maxSelection ? `/${maxSelection}` : ""} selected
                  </span>
                  <span
                    onClick={() => setSelected([])}
                    style={{ cursor: "pointer", color: dangerColor, fontWeight: 500 }}
                  >
                    Clear
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {hasError && (
          <p role="alert" style={{ fontSize: font - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p style={{ fontSize: font - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
            {helperText}
          </p>
        )}

        <style>{`
                    @keyframes msDropIn {
                        from { opacity: 0; transform: translateY(-6px); }
                        to   { opacity: 1; transform: translateY(0);    }
                    }
                `}</style>
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";


// Example usuage:
// Basic multi-select
{/* <MultiSelect
    label="Allergens"
    placeholder="Select allergens"
    options={[{ label: "Milk", value: "milk" }, { label: "Peanut", value: "peanut" }]}
    value={selected} onChange={setSelected}
/> */}

// Max selection + select all
{/* <MultiSelect
    label="Toppings" maxSelection={3} showSelectAll
    options={toppings} value={selected} onChange={setSelected}
    helperText="Pick up to 3"
/> */}

// Single select mode
{/* <MultiSelect singleSelect placeholder="Select meal type"
    options={mealOptions} value={meal} onChange={([v]) => setMeal(v)}
/> */}

// With icon + description per option
{/* <MultiSelect
    options={[
        { label: "Veg", value: "veg", description: "Plant based", icon: <LeafIcon size={14} /> },
        { label: "Non-Veg", value: "nonveg", description: "Includes meat", icon: <DrumstickIcon size={14} /> },
    ]}
    value={filters} onChange={setFilters}
/> */}

// Sizes & Variants
{/* <MultiSelect size="sm" variant="filled"    options={opts} value={v} onChange={setV} /> */ }
{/* <MultiSelect size="lg" variant="underline" options={opts} value={v} onChange={setV} /> */ }

// Error state
{/* <MultiSelect error="Please select at least one" options={opts} value={[]} onChange={setV} /> */ }

// With RHF (no FormProvider needed)
{/* <Controller name="allergens" control={control}
    render={({ field }) => (
        <MultiSelect
            label="Allergens"
            options={allergenOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.allergens?.message}
        />
    )}
/> */}