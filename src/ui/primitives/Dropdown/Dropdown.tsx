import { useTheme } from "@/ui/theme/ThemeContext";
import { Check, ChevronDown, Search, X } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";
import { Input } from "../Input/Input";

interface DropdownOption {
    label: string;
    icon?: React.ReactNode;
    value: string | number;
    onClick?: () => void;
    disabled?: boolean;
}

type DropdownSize = "sm" | "md" | "lg" | "xl" | "full";
type DropdownVariant = "primary" | "outline" | "danger";

interface BaseProps {
    options?: DropdownOption[];
    loadOptions?: (input: string) => Promise<DropdownOption[]>;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    error?: string;
    size?: DropdownSize;
    variant?: DropdownVariant;
    className?: string;
    placement?: "auto" | "down" | "up";
}

type SingleProps = BaseProps & {
    mode: "single";
    value: string | number | null;
    onChange: (value: string | number | null) => void;
};

type MultiProps = BaseProps & {
    mode: "multiple";
    value: (string | number)[];
    onChange: (value: (string | number)[]) => void;
};

type DropdownProps = SingleProps | MultiProps;

const sizeClasses: Record<DropdownSize, string> = {
    sm:   "h-8 text-xs px-2.5 w-40",
    md:   "h-10 text-sm px-3 w-56",
    lg:   "h-11 text-sm px-4 w-72",
    xl:   "h-12 text-base px-5 w-96",
    full: "h-10 text-sm px-3 w-full",
};

const PANEL_HEIGHT = 280;

export const Dropdown: React.FC<DropdownProps> = ({
    mode,
    options = [],
    loadOptions,
    value,
    onChange,
    placeholder = "Select option",
    label,
    disabled = false,
    error,
    size = "md",
    className = "",
    placement = "auto",
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const [isOpen, setIsOpen]               = useState(false);
    const [search, setSearch]               = useState("");
    const [asyncOptions, setAsyncOptions]   = useState<DropdownOption[]>([]);
    const [loading, setLoading]             = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [openUp, setOpenUp]               = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef  = useRef<HTMLDivElement>(null);
    const searchRef   = useRef<HTMLInputElement>(null);

    // ── For static options: filter client-side by search term ─────────────────
    // For async options: show whatever the API returned (API handles filtering)
    const displayedOptions: DropdownOption[] = loadOptions
        ? asyncOptions
        : search.trim()
            ? options.filter(o =>
                o.label.toLowerCase().includes(search.toLowerCase())
              )
            : options;

    // ── Placement ──────────────────────────────────────────────────────────────
    const computePlacement = useCallback(() => {
        if (placement !== "auto") { setOpenUp(placement === "up"); return; }
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setOpenUp(spaceBelow < PANEL_HEIGHT && spaceAbove > spaceBelow);
    }, [placement]);

    // ── Outside click ──────────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!dropdownRef.current?.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── On open: compute placement + focus search ──────────────────────────────
    useEffect(() => {
        if (isOpen) {
            computePlacement();
            setTimeout(() => searchRef.current?.focus(), 50);
        } else {
            setSearch("");
            setHighlightIndex(-1);
        }
    }, [isOpen, computePlacement]);

    // ── Recompute on scroll/resize while open ──────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener("scroll", computePlacement, true);
        window.addEventListener("resize", computePlacement);
        return () => {
            window.removeEventListener("scroll", computePlacement, true);
            window.removeEventListener("resize", computePlacement);
        };
    }, [isOpen, computePlacement]);

    // ── Async: debounced fetch on search change ────────────────────────────────
    // Static options: no fetch needed - filtering is done in displayedOptions above
    useEffect(() => {
        if (!loadOptions) return;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const result = await loadOptions(search);
                setAsyncOptions(result);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, loadOptions]);

    // ── Initial async load (empty search) ─────────────────────────────────────
    useEffect(() => {
        if (!loadOptions || !isOpen || asyncOptions.length > 0) return;
        loadOptions("").then(setAsyncOptions).catch(() => {});
    }, [isOpen, loadOptions]);

    const isSelected = (val: string | number) =>
        mode === "single"
            ? value === val
            : (value as (string | number)[]).includes(val);

    const toggleSelect = (option: DropdownOption) => {
        if (option.disabled) return;
        option.onClick?.();
        if (mode === "single") {
            onChange(option.value);
            setIsOpen(false);
        } else {
            const selected = value as (string | number)[];
            onChange(
                selected.includes(option.value)
                    ? selected.filter(v => v !== option.value)
                    : [...selected, option.value]
            );
        }
    };

    const dropdownStyle: CSSProperties = {
        background: c.surface,
        border: `1px solid ${c.primaryBorder}`,
    };

    const displayLabel =
        mode === "single"
            ? (loadOptions ? asyncOptions : options).find(o => o.value === value)?.label
            : null;

    const multiSelected = mode === "multiple" ? (value as (string | number)[]) : [];

    // ── Styles ─────────────────────────────────────────────────────────────────
    const triggerStyle: CSSProperties = {
        background: disabled ? c.primaryLight : c.surface,
        border: `1px solid ${error ? c.danger : c.primaryBorder}`,
        color: c.text,
    };

    const triggerHeight = triggerRef.current?.offsetHeight ?? 40;

    const panelPositionStyle: CSSProperties = openUp
        ? { position: "absolute", bottom: triggerHeight + 6, left: 0, width: "100%", zIndex: 50 }
        : {};

    const panelPositionClass = openUp
        ? "rounded-lg shadow-lg overflow-hidden"
        : "relative left-0 w-full z-50 mt-1.5 rounded-lg shadow-lg overflow-hidden";

    return (
        <div ref={dropdownRef} className={`relative ${sizeClasses[size]} ${className}`}>

            {/* Label */}
            {label && (
                <p style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 4 }}>
                    {label}
                </p>
            )}

            {/* Trigger */}
            <div
                ref={triggerRef}
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={triggerStyle}
                className="flex items-center justify-between gap-2 w-full h-full rounded-lg cursor-pointer select-none transition-all duration-150"
            >
                <span
                    className="flex-1 truncate ml-2"
                    style={{ color: !displayLabel && multiSelected.length === 0 ? c.textMuted : c.text }}
                >
                    {mode === "multiple" && multiSelected.length > 0
                        ? `${multiSelected.length} selected`
                        : displayLabel ?? placeholder}
                </span>
                <ChevronDown
                    className="mr-2"
                    style={{
                        color: c.textMuted,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                    }}
                />
            </div>

            {/* Panel */}
            {isOpen && (
                <div
                    style={{ ...dropdownStyle, ...panelPositionStyle }}
                    className={panelPositionClass}
                >
                    {/* Search input */}
                    {/* <div style={{ padding: "8px 8px 4px", borderBottom: `1px solid ${c.primaryBorder}` }}> */}
                        <div className="relative w-full" ref={searchRef}>
                            <Search
                                className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color: c.textMuted }}
                            />
                            <Input
                                ref={searchRef}
                                value={search}
                                onChange={e => { setSearch(e.target.value); setHighlightIndex(-1); }}
                                placeholder="Search..."
                                style={{
                                background: c.primaryLight,
                                border: `1px solid ${c.primaryBorder}`,
                                color: c.text,
                            }}
                            className="w-full pl-10 pr-3 py-2 text-sm rounded-md outline-none"
                            />
                            {/* Clear search button */}
                            {search && (
                                <button
                                    onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                                    style={{
                                        position: "absolute", right: 7, top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none", border: "none",
                                        cursor: "pointer", display: "flex", padding: 0,
                                        color: c.textMuted,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    {/* </div> */}

                    {/* Options list */}
                    <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                        {loading ? (
                            <div style={{ padding: "12px 0", textAlign: "center", fontSize: 13, color: c.textMuted }}>
                                Loading…
                            </div>
                        ) : displayedOptions.length === 0 ? (
                            <div style={{ padding: "12px 0", textAlign: "center", fontSize: 13, color: c.textMuted }}>
                                {search ? `No results for "${search}"` : "No options found"}
                            </div>
                        ) : (
                            displayedOptions.map((option, index) => {
                                const selected = isSelected(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => toggleSelect(option)}
                                        style={{
                                            display: "flex", alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "8px 12px", margin: "2px 6px",
                                            borderRadius: 6, fontSize: 13, cursor: "pointer",
                                            background: selected
                                                ? c.hover
                                                : highlightIndex === index
                                                    ? c.primaryLight
                                                    : "transparent",
                                            color: option.disabled
                                                ? c.textMuted
                                                : selected ? c.accent : c.text,
                                            fontWeight: selected ? 500 : 400,
                                            opacity: option.disabled ? 0.5 : 1,
                                            transition: "background 0.1s",
                                        }}
                                        onMouseEnter={e => {
                                            if (!selected) (e.currentTarget as HTMLElement).style.background = c.primaryLight;
                                            setHighlightIndex(index);
                                        }}
                                        onMouseLeave={e => {
                                            if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent";
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {option.icon && (
                                                <span style={{ display: "flex", flexShrink: 0 }}>{option.icon}</span>
                                            )}
                                            <span>{option.label}</span>
                                        </div>
                                        {selected && <Check size={14} style={{ color: c.accent, flexShrink: 0 }} />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p style={{ fontSize: 12, marginTop: 4, color: c.danger }}>{error}</p>
            )}
        </div>
    );
};