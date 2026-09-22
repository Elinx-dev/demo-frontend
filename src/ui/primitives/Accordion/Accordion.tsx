import React, { useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";

export interface AdvancedAccordionItem {
  id: string;
  title?: React.ReactNode;
  content?: React.ReactNode;

  // Header customization
  headerBg?: string;
  headerTextColor?: string;
  headerTextSize?: string;
  headerClassName?: string;  // ✅ if passed, skips inline header bg/color
  headerStyle?: CSSProperties; // ✅ merges on top of theme styles

  // Header slots for flexibility
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;

  // Content customization
  contentBg?: string;
  contentTextColor?: string;
  contentTextSize?: string;
  contentClassName?: string; // ✅ if passed, skips inline content bg/color
  contentStyle?: CSSProperties; // ✅ merges on top of theme styles

  // Content slots for flexibility
  contentLeft?: React.ReactNode;
  contentCenter?: React.ReactNode;
  contentRight?: React.ReactNode;

  useContainerBg?: boolean;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  image?: string;

  width?: string;
  height?: string;

  borderColor?: string;
  borderRadius?: string;
  shadow?: string;

  wrapperClassName?: string; // ✅ if passed, skips inline border color
  wrapperStyle?: CSSProperties; // ✅ merges on top of theme styles
}

export interface AdvancedAccordionProps {
  items: AdvancedAccordionItem[];
  allowMultiple?: boolean;
  className?: string;
  defaultOpenIds?: string[];
  controlledOpenIds?: string[];
  onChange?: (openIds: string[]) => void;
  containerBg?: string;
  containerPadding?: string;
  containerBorder?: string;
  containerShadow?: string;
  containerBorderRadius?: string;
  containerStyle?: CSSProperties; // ✅ merges on top of container theme styles
}

const Accordion: React.FC<AdvancedAccordionProps> = ({
  items,
  allowMultiple = false,
  className = "",
  defaultOpenIds = [],
  controlledOpenIds,
  onChange,
  containerBg,
  containerPadding = "p-0",
  containerBorder = "border-none",
  containerShadow,
  containerBorderRadius,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const [internalOpen, setInternalOpen] = useState<string[]>(defaultOpenIds);
  const openItems = controlledOpenIds ?? internalOpen;

  const toggleItem = (id: string) => {
    let updated: string[] = [];

    if (allowMultiple) {
      updated = openItems.includes(id)
        ? openItems.filter((i) => i !== id)
        : [...openItems, id];
    } else {
      updated = openItems.includes(id) ? [] : [id];
    }

    if (!controlledOpenIds) setInternalOpen(updated);
    onChange?.(updated);
  };

  // ✅ Container: skip inline bg if className is passed (Tailwind would lose otherwise)
  const containerStyles: CSSProperties = className
    ? { ...containerStyle }
    : { background: containerBg ?? c.background, ...containerStyle };

  return (
    <div
      className={`w-full space-y-3 ${containerPadding} ${containerBorder} ${containerShadow ?? ""} ${containerBorderRadius ?? ""} ${className}`}
      style={containerStyles}
    >
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);

        // ✅ Header: skip inline bg/color if headerClassName is passed
        const headerStyles: CSSProperties = item.headerClassName
          ? { ...item.headerStyle }
          : {
            background: item.useContainerBg
              ? containerBg ?? c.background
              : item.headerBg ?? c.surface,
            color: item.useContainerBg
              ? c.text
              : item.headerTextColor ?? c.text,
            ...item.headerStyle, // always merge headerStyle on top
          };

        // ✅ Content: skip inline bg/color if contentClassName is passed
        const contentStyles: CSSProperties = item.contentClassName
          ? { ...item.contentStyle }
          : {
            background: item.useContainerBg
              ? containerBg ?? c.background
              : item.contentBg ?? c.primaryLight,
            color: item.useContainerBg
              ? c.text
              : item.contentTextColor ?? c.textMuted,
            ...item.contentStyle, // always merge contentStyle on top
          };

        // ✅ Wrapper: skip inline borderColor if wrapperClassName is passed
        const wrapperStyles: CSSProperties = item.wrapperClassName
          ? { ...item.wrapperStyle }
          : {
            borderColor: item.borderColor ?? c.primaryBorder,
            ...item.wrapperStyle, // always merge wrapperStyle on top
          };

        return (
          <div
            key={item.id}
            className={`border ${item.shadow ?? "shadow-sm"} ${item.borderRadius ?? "rounded-xl"} overflow-hidden ${item.wrapperClassName ?? ""}`}
            style={{ ...wrapperStyles, width: item.width, height: item.height }}
          >
            {/* Header */}
            <button
              onClick={() => toggleItem(item.id)}
              style={headerStyles}
              className={`w-full p-4 transition-all duration-200 flex items-center justify-between ${item.headerClassName ?? ""}`}
            >
              {/* Left */}
              <div className="flex items-center gap-2">
                {item.headerLeft ?? (
                  <>
                    {item.image && (
                      <img
                        src={item.image}
                        alt="accordion"
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    )}
                    {item.leftIcon}
                  </>
                )}
              </div>

              {/* Center */}
              <div className="flex-1 text-center">
                {item.headerCenter ?? item.title}
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                {item.headerRight}
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Content */}
            <div
              className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[1000px]" : "max-h-0"}`}
            >
              <div
                style={contentStyles}
                className={`p-4 ${item.contentClassName ?? ""}`}
              >
                <div className="flex w-full items-center justify-between">
                  <div>{item.contentLeft}</div>
                  <div className="flex-1 text-center">
                    {item.contentCenter ?? item.content}
                  </div>
                  <div>{item.contentRight}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;

// ─── Usage Examples ───────────────────────────────────────────────────────────

// 1️⃣ Default - fully theme-driven, no overrides needed
// <Accordion items={items} />

// 2️⃣ Container-level Tailwind override (className skips inline bg)
// <Accordion items={items} className="bg-red-300 rounded-xl p-4" />

// 3️⃣ Container-level inline style override
// <Accordion items={items} containerBg="#e8f1e4" containerPadding="p-4" />

// 4️⃣ Per-item header Tailwind override (headerClassName skips inline bg/color)
// <Accordion items={[{
//   id: "1", title: "Hello", content: "World",
//   headerClassName: "bg-pink-200 text-pink-900",
// }]} />

// 5️⃣ Per-item header inline style override (always merges on top of theme)
// <Accordion items={[{
//   id: "1", title: "Hello", content: "World",
//   headerStyle: { background: "deeppink", color: "white" },
// }]} />

// 6️⃣ Per-item content Tailwind override
// <Accordion items={[{
//   id: "1", title: "Hello", content: "World",
//   contentClassName: "bg-yellow-100 text-yellow-900",
// }]} />