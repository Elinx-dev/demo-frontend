import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type CSSProperties,
} from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { X } from "lucide-react";

type TabVariant = "underline" | "pills" | "boxed";
type TabSize = "sm" | "md" | "lg";
type Orientation = "horizontal" | "vertical";
type TabsAppearance = "default" | "navbar";

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: number;
  icon?: React.ReactNode;
  closable?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  defaultActiveTab?: string;
  onChange?: (id: string) => void;
  onClose?: (id: string) => void;
  onReorder?: (tabs: TabItem[]) => void;
  variant?: TabVariant;
  size?: TabSize;
  orientation?: Orientation;
  scrollable?: boolean;
  fullWidth?: boolean;
  lazy?: boolean;
  className?: string;
  appearance?: TabsAppearance;
  /** Override the theme accent for this Tabs instance (e.g. a portal's brand color) */
  accentColor?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  defaultActiveTab,
  onChange,
  onClose,
  onReorder,
  variant = "underline",
  size = "md",
  orientation = "horizontal",
  scrollable = true,
  fullWidth = false,
  lazy = true,
  className = "",
  appearance = "default",
  accentColor,
}) => {
  void lazy;
  const { theme } = useTheme();
  const c = theme.colors;
  const accent = accentColor ?? c.accent;

  const isControlled = activeTab !== undefined;
  const [internalActive, setInternalActive] = useState(
    defaultActiveTab || tabs[0]?.id,
  );
  const currentActive = isControlled ? activeTab! : internalActive;

  const setActive = (id: string) => {
    if (!isControlled) setInternalActive(id);
    onChange?.(id);
  };

  const [internalTabs, setInternalTabs] = useState(tabs);
  useEffect(() => setInternalTabs(tabs), [tabs]);

  const handleDrag = (from: number, to: number) => {
    const updated = [...internalTabs];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setInternalTabs(updated);
    onReorder?.(updated);
  };

  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useLayoutEffect(() => {
    if (variant !== "underline") return;
    const activeEl = tabRefs.current[currentActive];
    const indicator = indicatorRef.current;

    if (activeEl && indicator) {
      indicator.style.width = `${activeEl.offsetWidth}px`;
      indicator.style.left = `${activeEl.offsetLeft}px`;
    }
  }, [currentActive, internalTabs, variant]);

  const sizeClasses: Record<TabSize, string> = {
    sm: "text-xs px-2 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  const isVertical = orientation === "vertical";

  const containerStyle: CSSProperties = {
    borderBottom:
      variant === "underline" ? `1.5px solid ${c.primaryBorder}` : undefined,
    background: variant === "pills" ? `${accent}0d` : undefined,
    boxShadow: variant === "pills" ? `inset 0 0 0 1px ${accent}1f` : undefined,
    border: variant === "boxed" ? `1px solid ${c.primaryBorder}` : undefined,
  };

  const isNavbar = appearance === "navbar";

  const activeTabItem = internalTabs.find((t) => t.id === currentActive);

  return (
    <div
      className={`flex ${isVertical ? "flex-row" : "flex-col"} ${className}`}
    >
      {/* ================= TAB LIST ================= */}
      <div
        role="tablist"
        style={
          isNavbar
            ? { borderBottom: `1px solid ${c.primaryBorder}` }
            : containerStyle
        }
        className={`
          relative flex ${scrollable && !isVertical ? "flex-nowrap overflow-x-auto" : "flex-wrap"}
          ${isVertical ? "flex-col w-48" : "flex-row"}
          ${!isNavbar && variant === "pills" ? "gap-1 p-1.5 rounded-xl w-fit" : ""}
          ${!isNavbar && variant === "boxed" ? "gap-1 rounded-lg w-fit" : ""}
          ${isNavbar ? "-mb-px gap-6 px-0" : ""}
        `}
      >
        {/* Indicator */}
        {variant === "underline" && !isNavbar && (
          <div
            ref={indicatorRef}
            style={{ background: accent, boxShadow: `0 1px 4px ${accent}66` }}
            className="absolute bottom-0 h-0.75 rounded-full transition-all duration-300"
          />
        )}

        {internalTabs.map((tab, index) => {
          const isActive = tab.id === currentActive;

          const tabStyle: CSSProperties = {
            color: tab.disabled
              ? c.textMuted
              : isActive
                ? variant === "pills"
                  ? accent
                  : accent
                : c.textMuted,
            background: isNavbar
              ? "transparent"
              : variant === "pills" && isActive
                ? c.surface
                : variant === "boxed" && isActive
                  ? `${accent}14`
                  : variant === "underline" && isActive
                    ? `${accent}0a`
                    : "transparent",
            boxShadow: variant === "pills" && isActive ? `0 1px 4px rgba(0,0,0,.10)` : undefined,
            borderRadius: variant === "pills" ? 9 : variant === "underline" ? "8px 8px 0 0" : undefined,
            fontWeight: isActive ? (variant === "underline" ? 700 : 700) : 500,
            transition: "all 160ms ease",
          };

          if (isNavbar) {
            const borderColor = isActive ? c.accent : "transparent";
            const hoverBorder = c.primaryBorder;
            const hoverText = c.text;

            return (
              <button
                key={tab.id}
                role="tab"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("text/plain", index.toString())
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const from = Number(e.dataTransfer.getData("text/plain"));
                  handleDrag(from, index);
                }}
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && setActive(tab.id)}
                className={`
                                    group inline-flex items-center gap-2
                                    border-b-2 px-1 py-3 text-sm font-medium
                                    ${tab.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                `}
                style={{
                  color: tabStyle.color,
                  borderColor,
                }}
                onMouseEnter={(e) => {
                  if (tab.disabled || isActive) return;
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    hoverBorder;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    hoverText;
                }}
                onMouseLeave={(e) => {
                  if (tab.disabled || isActive) return;
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = String(
                    c.textMuted,
                  );
                }}
              >
                {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span
                    style={{
                      background: `${accent}1f`,
                      color: accent,
                    }}
                    className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  >
                    {tab.badge}
                  </span>
                )}

                {tab.closable && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose?.(tab.id);
                    }}
                    style={{ color: c.textMuted }}
                    className="ml-1 hover:opacity-70"
                  >
                    <X />
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              role="tab"
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("text/plain", index.toString())
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const from = Number(e.dataTransfer.getData("text/plain"));
                handleDrag(from, index);
              }}
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setActive(tab.id)}
              style={{ ...tabStyle, border: "none" }}
              onMouseEnter={(e) => {
                if (tab.disabled || isActive) return;
                e.currentTarget.style.background = `${accent}0d`;
                e.currentTarget.style.color = c.text;
              }}
              onMouseLeave={(e) => {
                if (tab.disabled || isActive) return;
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = String(c.textMuted);
              }}
              className={`
        relative flex items-center ${size === "sm" ? "gap-1" : "gap-2"} whitespace-nowrap
        ${sizeClasses[size]}
        ${fullWidth ? "flex-1 justify-center" : "shrink-0"}
        ${tab.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  style={{
                    background: isActive ? `${accent}1f` : c.primaryLight,
                    color: accent,
                  }}
                  className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                >
                  {tab.badge}
                </span>
              )}

              {tab.closable && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose?.(tab.id);
                  }}
                  style={{ color: c.textMuted }}
                  className="ml-1 hover:opacity-70"
                >
                  <X />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB CONTENT ================= */}
      <div
        className={isNavbar ? "flex-1 mt-4 overflow-y-auto" : "flex-1 p-4 min-h-0 overflow-hidden"}
        style={{
          color: c.text,
          background: isNavbar ? "transparent" : c.surface,
        }}
      >
        {activeTabItem && (
          <div key={activeTabItem.id} role="tabpanel" style={{ height: "100%", overflowY: "auto" }}>
            {activeTabItem.content}
          </div>
        )}
      </div>
    </div>
  );
};

//usage
// const [active, setActive] = useState("overview");

// const tabs = [
//   {
//     id: "overview",
//     label: "Overview",
//     content: <div>Overview Content</div>,
//   },
//   {
//     id: "users",
//     label: "Users",
//     badge: 5,
//     closable: true,
//     content: <div>Users Content</div>,
//   },
//   {
//     id: "settings",
//     label: "Settings",
//     content: <div>Settings Content</div>,
//   },
// ];

// <Tabs
//   tabs={tabs}
//   activeTab={active}
//   onChange={setActive}
//   variant="underline"
//   size="md"
//   scrollable
// />
