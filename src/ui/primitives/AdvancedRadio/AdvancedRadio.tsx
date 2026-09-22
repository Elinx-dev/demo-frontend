import React, { useId, type CSSProperties } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "success" | "danger" | "warning";
type Layout = "stack" | "grid" | "toggle";

export interface AdvancedRadioOption {
  label: string;
  value: string;
  description?: string;
  /** Image/illustration URL */
  image?: string;
  /** Icon element */
  icon?: React.ReactNode;
  /** Price string e.g "$29/mo" */
  price?: string;
  /** Price sub-label e.g "billed annually" */
  priceSub?: string;
  /** Shows a "Popular" ribbon */
  popular?: boolean;
  /** Custom ribbon label override */
  ribbonLabel?: string;
  /** Additional feature bullets */
  features?: string[];
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface AdvancedRadioProps {
  options: AdvancedRadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  name?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  size?: Size;
  variant?: Variant;
  activeColor?: string;
  /** stack = vertical list | grid = multi-column | toggle = pill-button row */
  layout?: Layout;
  /** Columns for grid layout. Default: 2 */
  columns?: number;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  dot: number; ring: number;
  cardRadius: number; pad: number; imgH: number;
  labelFont: number; descFont: number; priceFont: number;
  priceSubFont: number; featureFont: number; badgeFont: number;
  gap: number; togglePad: number; ribbonFont: number;
}> = {
  sm: { dot: 6, ring: 14, cardRadius: 8, pad: 12, imgH: 60, labelFont: 12, descFont: 11, priceFont: 16, priceSubFont: 10, featureFont: 11, badgeFont: 10, gap: 6, togglePad: 8, ribbonFont: 9 },
  md: { dot: 8, ring: 18, cardRadius: 10, pad: 16, imgH: 80, labelFont: 14, descFont: 12, priceFont: 20, priceSubFont: 11, featureFont: 12, badgeFont: 11, gap: 8, togglePad: 12, ribbonFont: 10 },
  lg: { dot: 10, ring: 22, cardRadius: 12, pad: 20, imgH: 100, labelFont: 15, descFont: 13, priceFont: 24, priceSubFont: 12, featureFont: 13, badgeFont: 12, gap: 10, togglePad: 16, ribbonFont: 11 },
};

// ─── Checkmark tick (for feature list) ───────────────────────────────────────

const Tick = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="7" fill={`${color}20`} />
    <polyline points="4.5,8 7,10.5 11.5,5.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── AdvancedRadio ────────────────────────────────────────────────────────────

export const AdvancedRadio = React.forwardRef<HTMLDivElement, AdvancedRadioProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      label,
      name,
      error,
      helperText,
      disabled = false,
      size = "md",
      variant = "primary",
      activeColor: activeColorProp,
      layout = "stack",
      columns = 2,
      className = "",
    },
    ref
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const groupId = useId();
    const groupName = name ?? groupId;

    // ── Controlled / uncontrolled ─────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue ?? "");
    const selected = isControlled ? (value ?? "") : internal;

    const handleSelect = (val: string) => {
      if (!isControlled) setInternal(val);
      onChange?.(val);
    };

    // ── Colors ────────────────────────────────────────────────────────────
    const variantColorMap: Record<Variant, string> = {
      primary: c.accent ?? "#6366f1",
      success: c.success ?? "#22c55e",
      danger: c.danger ?? "#ef4444",
      warning: c.warning ?? "#f59e0b",
    };
    const accentColor = activeColorProp ?? variantColorMap[variant];
    const dangerColor = c.danger ?? "#ef4444";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = c.text ?? "#111827";
    const mutedColor = c.textMuted ?? "#9ca3af";
    const surfaceBg = c.surface ?? "#ffffff";
    const surfaceAlt = c.primaryLight ?? "#f9fafb";

    const { dot, ring, cardRadius, pad, imgH,
      labelFont, descFont, priceFont, priceSubFont,
      featureFont, badgeFont, gap, togglePad, ribbonFont } = sizeMap[size];

    const hasError = !!error;

    // ── Toggle layout ─────────────────────────────────────────────────────
    if (layout === "toggle") {
      return (
        <div ref={ref} className={className} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {label && (
            <span style={{ fontSize: labelFont, fontWeight: 600, color: textColor }}>
              {label}
            </span>
          )}
          <div
            role="radiogroup"
            style={{
              display: "inline-flex",
              borderRadius: cardRadius,
              border: `1.5px solid ${hasError ? dangerColor : borderColor}`,
              overflow: "hidden",
              background: surfaceAlt,
            }}
          >
            {options.map((opt, idx) => {
              const isChecked = selected === opt.value;
              const isDisabled = disabled || !!opt.disabled;
              const optId = `${groupId}-toggle-${idx}`;

              return (
                <React.Fragment key={opt.value}>
                  {idx > 0 && (
                    <div style={{ width: 1, background: borderColor, flexShrink: 0 }} />
                  )}
                  <input
                    id={optId}
                    type="radio"
                    name={groupName}
                    value={opt.value}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => !isDisabled && handleSelect(opt.value)}
                    style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
                  />
                  <label
                    htmlFor={optId}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: `${togglePad * 0.5}px ${togglePad}px`,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      background: isChecked
                        ? (isDisabled ? `${accentColor}88` : accentColor)
                        : "transparent",
                      color: isChecked ? "#fff" : isDisabled ? mutedColor : textColor,
                      fontSize: labelFont,
                      fontWeight: isChecked ? 600 : 400,
                      transition: "all 0.15s",
                      userSelect: "none",
                      opacity: isDisabled ? 0.55 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {opt.icon && (
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {opt.icon}
                      </span>
                    )}
                    {opt.label}
                  </label>
                </React.Fragment>
              );
            })}
          </div>
          {hasError && (
            <p role="alert" style={{ fontSize: labelFont - 2, color: dangerColor, margin: 0 }}>{error}</p>
          )}
          {!hasError && helperText && (
            <p style={{ fontSize: labelFont - 2, color: mutedColor, margin: 0 }}>{helperText}</p>
          )}
        </div>
      );
    }

    // ── Stack / Grid layout ───────────────────────────────────────────────
    return (
      <div
        ref={ref}
        className={className}
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-invalid={hasError}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {/* Group label */}
        {label && (
          <span
            id={`${groupId}-label`}
            style={{ fontSize: labelFont, fontWeight: 600, color: textColor, userSelect: "none" }}
          >
            {label}
          </span>
        )}

        {/* Options grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: layout === "grid"
            ? `repeat(${columns}, minmax(0, 1fr))`
            : "1fr",
          gap: gap,
        }}>
          {options.map((opt, idx) => {
            const isChecked = selected === opt.value;
            const isDisabled = disabled || !!opt.disabled;
            const optId = `${groupId}-opt-${idx}`;
            const ribbonText = opt.ribbonLabel ?? (opt.popular ? "Popular" : null);

            return (
              <div key={opt.value} style={{ position: "relative" }}>
                {/* Hidden native input */}
                <input
                  id={optId}
                  type="radio"
                  name={groupName}
                  value={opt.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => !isDisabled && handleSelect(opt.value)}
                  aria-label={opt.label}
                  style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
                />

                {/* Card */}
                <CardItem
                  opt={opt}
                  isChecked={isChecked}
                  isDisabled={isDisabled}
                  optId={optId}
                  ribbonText={ribbonText}
                  onSelect={() => !isDisabled && handleSelect(opt.value)}
                  accentColor={accentColor}
                  dangerColor={dangerColor}
                  borderColor={borderColor}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  surfaceBg={surfaceBg}
                  surfaceAlt={surfaceAlt}
                  hasGroupError={hasError}
                  dot={dot} ring={ring} cardRadius={cardRadius} pad={pad} imgH={imgH}
                  labelFont={labelFont} descFont={descFont} priceFont={priceFont}
                  priceSubFont={priceSubFont} featureFont={featureFont}
                  badgeFont={badgeFont} ribbonFont={ribbonFont}
                />
              </div>
            );
          })}
        </div>

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

AdvancedRadio.displayName = "AdvancedRadio";

// ─── Card Item (extracted for clarity) ───────────────────────────────────────

interface CardItemProps {
  opt: AdvancedRadioOption;
  isChecked: boolean;
  isDisabled: boolean;
  optId: string;
  ribbonText: string | null;
  onSelect: () => void;
  accentColor: string;
  dangerColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  surfaceBg: string;
  surfaceAlt: string;
  hasGroupError: boolean;
  dot: number; ring: number; cardRadius: number; pad: number; imgH: number;
  labelFont: number; descFont: number; priceFont: number; priceSubFont: number;
  featureFont: number; badgeFont: number; ribbonFont: number;
}

const CardItem = ({
  opt, isChecked, isDisabled, optId, ribbonText,
  // onSelect
  accentColor, dangerColor, borderColor, textColor, mutedColor, surfaceBg, surfaceAlt,
  hasGroupError, dot, ring, cardRadius, pad, imgH,
  labelFont, descFont, priceFont, priceSubFont, featureFont, badgeFont, ribbonFont,
}: CardItemProps) => {
  const [hovered, setHovered] = React.useState(false);

  const cardStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    borderRadius: cardRadius,
    border: `1.5px solid ${hasGroupError ? dangerColor :
      isChecked ? accentColor :
        hovered && !isDisabled ? accentColor :
          borderColor
      }`,
    background: isChecked
      ? `${accentColor}0a`
      : hovered && !isDisabled
        ? `${accentColor}05`
        : isDisabled ? surfaceAlt : surfaceBg,
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.55 : 1,
    overflow: "hidden",
    transition: "all 0.15s",
    boxShadow: isChecked && !isDisabled
      ? `0 0 0 3px ${accentColor}18`
      : hovered && !isDisabled
        ? "0 2px 8px rgba(0,0,0,0.08)"
        : "none",
    userSelect: "none",
    boxSizing: "border-box" as const,
    height: "100%",
  };

  return (
    <label
      htmlFor={optId}
      style={cardStyle}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      {opt.image && (
        <div style={{
          width: "100%", height: imgH, flexShrink: 0,
          overflow: "hidden", borderBottom: `1px solid ${borderColor}`,
        }}>
          <img
            src={opt.image}
            alt={opt.label}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Ribbon */}
      {ribbonText && (
        <div style={{
          position: "absolute",
          top: 12,
          right: -1,
          background: accentColor,
          color: "#fff",
          fontSize: ribbonFont,
          fontWeight: 700,
          padding: `2px 10px 2px 8px`,
          borderRadius: `${cardRadius / 2}px 0 0 ${cardRadius / 2}px`,
          boxShadow: `0 2px 4px ${accentColor}44`,
          letterSpacing: "0.03em",
          zIndex: 1,
        }}>
          {ribbonText}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>

        {/* Top row: radio dot + icon + badge */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Radio dot */}
            <div style={{
              width: ring, height: ring, borderRadius: "50%", flexShrink: 0,
              border: `1.5px solid ${isChecked ? accentColor : isDisabled ? `${borderColor}88` : borderColor}`,
              background: surfaceBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              boxShadow: isChecked && !isDisabled ? `0 0 0 3px ${accentColor}22` : "none",
            }}>
              <div style={{
                width: isChecked ? dot : 0, height: isChecked ? dot : 0,
                borderRadius: "50%",
                background: isDisabled ? `${accentColor}77` : accentColor,
                transition: "width 0.15s ease, height 0.15s ease",
              }} />
            </div>

            {/* Icon */}
            {opt.icon && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                color: isChecked ? accentColor : mutedColor,
                transition: "color 0.15s",
              }}>
                {opt.icon}
              </span>
            )}
          </div>

          {/* Badge */}
          {opt.badge && (
            <span style={{
              fontSize: badgeFont, fontWeight: 600,
              color: opt.badgeColor ? "#fff" : isChecked ? accentColor : mutedColor,
              background: opt.badgeColor ?? (isChecked ? `${accentColor}18` : `${borderColor}55`),
              borderRadius: 9999,
              padding: `2px ${badgeFont}px`,
              flexShrink: 0, whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}>
              {opt.badge}
            </span>
          )}
        </div>

        {/* Price */}
        {opt.price && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{
              fontSize: priceFont,
              fontWeight: 700,
              color: isChecked ? accentColor : textColor,
              lineHeight: 1,
              transition: "color 0.15s",
            }}>
              {opt.price}
            </span>
            {opt.priceSub && (
              <span style={{ fontSize: priceSubFont, color: mutedColor }}>
                {opt.priceSub}
              </span>
            )}
          </div>
        )}

        {/* Label */}
        <span style={{
          fontSize: labelFont,
          fontWeight: 600,
          color: isDisabled ? mutedColor : textColor,
          lineHeight: 1.4,
          transition: "color 0.15s",
        }}>
          {opt.label}
        </span>

        {/* Description */}
        {opt.description && (
          <span style={{
            fontSize: descFont,
            color: isDisabled ? `${mutedColor}80` : mutedColor,
            lineHeight: 1.5,
          }}>
            {opt.description}
          </span>
        )}

        {/* Feature list */}
        {opt.features && opt.features.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {opt.features.map((f, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Tick size={featureFont + 2} color={isChecked ? accentColor : mutedColor} />
                <span style={{ fontSize: featureFont, color: isDisabled ? mutedColor : textColor }}>
                  {f}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
};


// Pricing cards (grid + price + features + ribbon)
{/* <AdvancedRadio
    layout="grid" columns={3} label="Choose Plan"
    value={plan} onChange={setPlan}
    options={[
        {
            label: "Basic", value: "basic",
            price: "Free", priceSub: "forever",
            description: "Perfect for getting started",
            features: ["5 projects", "1GB storage", "Email support"],
        },
        {
            label: "Pro", value: "pro",
            price: "$29", priceSub: "/month",
            description: "For growing teams",
            features: ["Unlimited projects", "50GB storage", "Priority support"],
            popular: true,
        },
        {
            label: "Enterprise", value: "enterprise",
            price: "$99", priceSub: "/month",
            description: "For large organizations",
            features: ["Everything in Pro", "Custom SLA", "Dedicated manager"],
            badge: "New", badgeColor: "#7c3aed",
        },
    ]}
/> */}

// Diet preference with image
{/* <AdvancedRadio
    label="Diet Type" value={diet} onChange={setDiet}
    options={[
        { label: "Veg", value: "veg", description: "Plant based meals", image: "/veg.jpg" },
        { label: "Non Veg", value: "nonveg", description: "Includes meat", image: "/nonveg.jpg" },
    ]}
/> */}

// Toggle bar (days, tabs, options)
{/* <AdvancedRadio
    layout="toggle" value={day} onChange={setDay}
    options={[
        { label: "Mon", value: "mon" },
        { label: "Tue", value: "tue" },
        { label: "Wed", value: "wed" },
        { label: "Thu", value: "thu", disabled: true },
    ]}
/> */}

// Sizes & Variants
{/* <AdvancedRadio layout="grid" columns={2} size="lg" variant="success" value={v} onChange={setV} options={opts} /> */ }