import React, { useId, useRef, useEffect, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";
type Direction = "vertical" | "horizontal";
type Layout = "simple" | "card";

export interface CheckboxOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  options: CheckboxOption[];
  /** Controlled selected values */
  value?: string[];
  /** Default selected values (uncontrolled) */
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  /** Group label shown above */
  label?: string;
  /** Error message shown below */
  error?: string;
  /** Helper text shown below (hidden when error present) */
  helperText?: string;
  /** Max number of selections allowed */
  maxSelection?: number;
  /** Min number of selections required */
  minSelection?: number;
  /** Disable all checkboxes */
  disabled?: boolean;
  size?: Size;
  variant?: Variant;
  direction?: Direction;
  /** Visual layout for each option */
  layout?: Layout;
  /** Show a "Select All" checkbox at the top */
  showSelectAll?: boolean;
  /** Label for the select all checkbox */
  selectAllLabel?: string;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  box: number; stroke: number; boxRadius: number;
  cardRadius: number; pad: number;
  labelFont: number; descFont: number; badgeFont: number;
  gap: number; groupGap: number; iconSize: number;
}> = {
  sm: { box: 14, stroke: 2, boxRadius: 3, cardRadius: 8, pad: 10, labelFont: 12, descFont: 11, badgeFont: 10, gap: 6, groupGap: 6, iconSize: 14 },
  md: { box: 18, stroke: 2.5, boxRadius: 4, cardRadius: 10, pad: 14, labelFont: 14, descFont: 12, badgeFont: 11, gap: 8, groupGap: 8, iconSize: 18 },
  lg: { box: 20, stroke: 3, boxRadius: 5, cardRadius: 12, pad: 18, labelFont: 15, descFont: 13, badgeFont: 12, gap: 10, groupGap: 10, iconSize: 22 },
};

// ─── SVG icons ────────────────────────────────────────────────────────────────

const Checkmark = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block" }}>
    <polyline points="3,8 6.5,11.5 13,4.5" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Dash = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block" }}>
    <line x1="3.5" y1="8" x2="12.5" y2="8" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);

// ─── Single option row ────────────────────────────────────────────────────────

interface OptionItemProps {
  option: CheckboxOption;
  isChecked: boolean;
  isDisabled: boolean;
  isMaxReached: boolean;
  inputId: string;
  onToggle: () => void;
  accentColor: string;
  dangerColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  surfaceBg: string;
  surfaceAlt: string;
  hasGroupError: boolean;
  size: Size;
  layout: Layout;
}

const OptionItem = ({
  option, isChecked, isDisabled, isMaxReached, inputId, onToggle,
  accentColor, dangerColor, borderColor, textColor, mutedColor, surfaceBg, surfaceAlt,
  hasGroupError, size, layout,
}: OptionItemProps) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = React.useState(false);

  const { box, stroke, boxRadius, cardRadius, pad, labelFont, descFont, badgeFont, iconSize } = sizeMap[size];

  // const canCheck = isChecked || !isMaxReached;
  const effectiveDisabled = isDisabled || (!isChecked && isMaxReached);

  // Checkbox tick box
  const CheckBox = (
    <div style={{
      width: box,
      height: box,
      borderRadius: boxRadius,
      flexShrink: 0,
      border: `1.5px solid ${hasGroupError ? dangerColor :
        isChecked ? accentColor :
          effectiveDisabled ? `${borderColor}88` :
            borderColor
        }`,
      background: isChecked
        ? (effectiveDisabled ? `${accentColor}77` : accentColor)
        : (effectiveDisabled ? `${borderColor}22` : surfaceBg),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.15s",
      boxSizing: "border-box" as const,
      marginTop: option.description ? 2 : 0,
    }}>
      {isChecked && <Checkmark size={box} stroke={stroke} />}
    </div>
  );

  const wrapperStyle: CSSProperties = layout === "card" ? {
    display: "flex",
    alignItems: option.description ? "flex-start" : "center",
    gap: pad * 0.7,
    padding: pad,
    borderRadius: cardRadius,
    border: `1.5px solid ${hasGroupError ? dangerColor :
      isChecked ? accentColor :
        hovered && !effectiveDisabled ? accentColor :
          borderColor
      }`,
    background: isChecked
      ? `${accentColor}0a`
      : hovered && !effectiveDisabled
        ? `${accentColor}05`
        : effectiveDisabled ? surfaceAlt : surfaceBg,
    cursor: effectiveDisabled ? "not-allowed" : "pointer",
    opacity: effectiveDisabled ? 0.55 : 1,
    transition: "all 0.15s",
    boxShadow: isChecked && !effectiveDisabled ? `0 0 0 3px ${accentColor}18` : "none",
    userSelect: "none",
    boxSizing: "border-box" as const,
  } : {
    display: "inline-flex",
    alignItems: option.description ? "flex-start" : "center",
    gap: sizeMap[size].gap,
    cursor: effectiveDisabled ? "not-allowed" : "pointer",
    opacity: effectiveDisabled ? 0.55 : 1,
    userSelect: "none",
    transition: "opacity 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Hidden native input */}
      <input
        id={inputId}
        ref={internalRef}
        type="checkbox"
        checked={isChecked}
        disabled={effectiveDisabled}
        onChange={onToggle}
        aria-label={option.label}
        style={{
          position: "absolute", width: 1, height: 1,
          padding: 0, margin: -1, overflow: "hidden",
          clip: "rect(0,0,0,0)", border: 0,
        }}
      />

      {/* Visual label */}
      <label
        htmlFor={inputId}
        style={wrapperStyle}
        onMouseEnter={() => !effectiveDisabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {CheckBox}

        {/* Icon */}
        {option.icon && (
          <span style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
            width: iconSize, height: iconSize,
            color: isChecked ? accentColor : mutedColor,
            transition: "color 0.15s",
          }}>
            {option.icon}
          </span>
        )}

        {/* Label + description */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{
            fontSize: labelFont,
            fontWeight: 500,
            color: effectiveDisabled ? mutedColor : isChecked ? textColor : textColor,
            lineHeight: 1.4,
            transition: "color 0.15s",
          }}>
            {option.label}
          </span>
          {option.description && (
            <span style={{
              fontSize: descFont,
              color: effectiveDisabled ? `${mutedColor}80` : mutedColor,
              lineHeight: 1.4,
            }}>
              {option.description}
            </span>
          )}
        </div>

        {/* Badge */}
        {option.badge && (
          <span style={{
            fontSize: badgeFont,
            fontWeight: 600,
            color: isChecked ? accentColor : mutedColor,
            background: isChecked ? `${accentColor}18` : `${borderColor}55`,
            borderRadius: 9999,
            padding: `2px ${badgeFont}px`,
            flexShrink: 0,
            whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}>
            {option.badge}
          </span>
        )}
      </label>
    </div>
  );
};

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      options,
      value,
      defaultValue = [],
      onChange,
      label,
      error,
      helperText,
      maxSelection,
      minSelection,
      disabled = false,
      size = "md",
      variant = "primary",
      direction = "vertical",
      layout = "simple",
      showSelectAll = false,
      selectAllLabel = "Select all",
      className = "",
    },
    ref
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const groupId = useId();
    const selectAllRef = useRef<HTMLInputElement>(null);

    // ── Controlled / uncontrolled ─────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<string[]>(defaultValue);
    const selected = isControlled ? (value ?? []) : internal;

    const setSelected = (next: string[]) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    };

    // ── Colors ────────────────────────────────────────────────────────────
    const variantColorMap: Record<Variant, string> = {
      primary: c.accent ?? "#6366f1",
      success: c.success ?? "#22c55e",
      danger: c.danger ?? "#ef4444",
      warning: c.warning ?? "#f59e0b",
    };
    const accentColor = c.accent ?? variantColorMap[variant];
    const dangerColor = c.danger ?? "#ef4444";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = c.text ?? "#111827";
    const mutedColor = c.textMuted ?? "#9ca3af";
    const surfaceBg = c.surface ?? "#ffffff";
    const surfaceAlt = c.primaryLight ?? "#f9fafb";

    const { labelFont, groupGap } = sizeMap[size];
    const hasError = !!error;
    const isMaxReached = !!maxSelection && selected.length >= maxSelection;

    // ── Toggle ────────────────────────────────────────────────────────────
    const toggleValue = (val: string) => {
      if (disabled) return;
      const isSelected = selected.includes(val);
      if (!isSelected && isMaxReached) return; // max cap
      const next = isSelected
        ? selected.filter(v => v !== val)
        : [...selected, val];
      setSelected(next);
    };

    // ── Select all state ──────────────────────────────────────────────────
    const enabledOptions = options.filter(o => !o.disabled);
    const allChecked = enabledOptions.length > 0 && enabledOptions.every(o => selected.includes(o.value));
    const someChecked = enabledOptions.some(o => selected.includes(o.value)) && !allChecked;

    // Set indeterminate DOM property
    useEffect(() => {
      if (selectAllRef.current) {
        selectAllRef.current.indeterminate = someChecked;
      }
    }, [someChecked]);

    const handleSelectAll = () => {
      if (disabled) return;
      if (allChecked) {
        // Deselect all (respect minSelection)
        const minKept = minSelection
          ? selected.slice(0, minSelection)
          : [];
        setSelected(minKept);
      } else {
        // Select all enabled (respect maxSelection)
        const all = enabledOptions.map(o => o.value);
        const next = maxSelection ? all.slice(0, maxSelection) : all;
        setSelected(next);
      }
    };

    const selectAllId = `${groupId}-select-all`;

    // ── Select All tick box ───────────────────────────────────────────────
    const { box, stroke, boxRadius } = sizeMap[size];

    const SelectAllBox = (
      <div style={{
        width: box, height: box, borderRadius: boxRadius,
        flexShrink: 0,
        border: `1.5px solid ${allChecked || someChecked ? accentColor : borderColor}`,
        background: allChecked || someChecked
          ? (disabled ? `${accentColor}77` : accentColor)
          : (disabled ? `${borderColor}22` : surfaceBg),
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s", boxSizing: "border-box" as const,
      }}>
        {someChecked && <Dash size={box} stroke={stroke} />}
        {allChecked && <Checkmark size={box} stroke={stroke} />}
      </div>
    );

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        ref={ref}
        className={className}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
        role="group"
        aria-labelledby={label ? `${groupId}-label` : undefined}
      >
        {/* Group label */}
        {label && (
          <span
            id={`${groupId}-label`}
            style={{
              fontSize: labelFont,
              fontWeight: 600,
              color: textColor,
              userSelect: "none",
            }}
          >
            {label}
            {maxSelection && (
              <span style={{ fontSize: labelFont - 2, fontWeight: 400, color: mutedColor, marginLeft: 6 }}>
                (max {maxSelection})
              </span>
            )}
          </span>
        )}

        {/* Select all row */}
        {showSelectAll && (
          <div style={{ display: "flex", alignItems: "center", gap: sizeMap[size].gap }}>
            <input
              id={selectAllId}
              ref={selectAllRef}
              type="checkbox"
              checked={allChecked}
              disabled={disabled}
              onChange={handleSelectAll}
              aria-label={selectAllLabel}
              style={{
                position: "absolute", width: 1, height: 1,
                padding: 0, margin: -1, overflow: "hidden",
                clip: "rect(0,0,0,0)", border: 0,
              }}
            />
            <label
              htmlFor={selectAllId}
              style={{
                display: "inline-flex", alignItems: "center",
                gap: sizeMap[size].gap,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.55 : 1,
                userSelect: "none",
              }}
            >
              {SelectAllBox}
              <span style={{ fontSize: labelFont, fontWeight: 600, color: textColor }}>
                {selectAllLabel}
              </span>
            </label>

            {/* Selection count badge */}
            {selected.length > 0 && (
              <span style={{
                fontSize: labelFont - 2, fontWeight: 600,
                color: accentColor, background: `${accentColor}15`,
                borderRadius: 9999, padding: "1px 8px",
              }}>
                {selected.length}{maxSelection ? `/${maxSelection}` : ""}
              </span>
            )}
          </div>
        )}

        {/* Divider after select all */}
        {showSelectAll && (
          <div style={{ height: 1, background: borderColor, opacity: 0.5 }} />
        )}

        {/* Options list */}
        <div style={{
          display: direction === "horizontal" ? "flex" : "flex",
          flexDirection: direction === "horizontal" ? "row" : "column",
          flexWrap: direction === "horizontal" ? "wrap" : "nowrap",
          gap: groupGap,
        }}>
          {options.map((option, idx) => {
            const optionId = `${groupId}-option-${idx}`;
            const isChecked = selected.includes(option.value);
            const isDisabled = disabled || !!option.disabled;

            return (
              <OptionItem
                key={option.value}
                option={option}
                isChecked={isChecked}
                isDisabled={isDisabled}
                isMaxReached={isMaxReached}
                inputId={optionId}
                onToggle={() => toggleValue(option.value)}
                accentColor={accentColor}
                dangerColor={dangerColor}
                borderColor={borderColor}
                textColor={textColor}
                mutedColor={mutedColor}
                surfaceBg={surfaceBg}
                surfaceAlt={surfaceAlt}
                hasGroupError={hasError}
                size={size}
                layout={layout}
              />
            );
          })}
        </div>

        {/* Min selection hint */}
        {minSelection && selected.length < minSelection && (
          <p style={{ fontSize: labelFont - 2, color: mutedColor, margin: 0 }}>
            Select at least {minSelection} option{minSelection > 1 ? "s" : ""}
          </p>
        )}

        {/* Error */}
        {hasError && (
          <p role="alert" style={{ fontSize: labelFont - 2, color: dangerColor, margin: 0, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p style={{ fontSize: labelFont - 2, color: mutedColor, margin: 0, lineHeight: 1.4 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

//Example usage:

// Basic
{/* <CheckboxGroup
    label="Allergens"
    options={[{ label: "Milk", value: "milk" }, { label: "Peanut", value: "peanut" }]}
    value={selected} onChange={setSelected}
/> */}

// Max selection + select all
{/* <CheckboxGroup
    label="Toppings" maxSelection={3} showSelectAll
    options={toppings}
    value={selected} onChange={setSelected}
    helperText="Pick up to 3 toppings"
/> */}

// With description + icon + badge per option
{/* <CheckboxGroup
    label="Filters" layout="card"
    options={[
        { label: "Veg Only", value: "veg", description: "Vegetarian meals", icon: <LeafIcon />, badge: "Popular" },
        { label: "Gluten Free", value: "gf", description: "No gluten ingredients", icon: <WheatIcon /> },
        { label: "Spicy",  value: "spicy", description: "Hot & spicy dishes", disabled: true },
    ]}
    value={filters} onChange={setFilters}
/> */}

// Horizontal pills layout
{/* <CheckboxGroup
    direction="horizontal" layout="card" size="sm"
    options={[{ label: "Mon", value: "mon" }, { label: "Tue", value: "tue" }, { label: "Wed", value: "wed" }]}
    value={days} onChange={setDays}
/> */}

// Error state
{/* <CheckboxGroup
    label="Preferences" minSelection={1}
    options={options} value={selected} onChange={setSelected}
    error={selected.length === 0 ? "Select at least one option" : undefined}
/> */}

// Disabled entire group
{/* <CheckboxGroup options={options} value={["milk"]} onChange={() => {}} disabled /> */ }