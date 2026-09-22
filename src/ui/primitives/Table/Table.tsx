import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import React from "react";
import {
  Search,
  X,
  Trash2,
  Download,
  Table as TableIcon,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Columns4,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { apiService } from "@/services/api";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select" | "date" | "number";
  filterOptions?: { label: string; value: any }[];
  render?: (item: T) => React.ReactNode;
  icon?: React.ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  hiddenByDefault?: boolean;
}

export interface SelectFilter {
  key: string;
  placeholder: string;
  options: { label: string; value: any }[];
  value: any;
  onChange: (value: any) => void;
}

export interface NestedDataConfig<T = any> {
  key: string;
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export interface ApiConfig {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  mapParams?: (state: {
    page: number;
    itemsPerPage: number;
    sortKey: string;
    sortDir: "asc" | "desc";
    search: string;
    filters: Record<string, any>;
  }) => Record<string, any>;
  mapResponse?: (response: any) => { data: any[]; total: number };
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data?: T[];
  itemsPerPage?: number;
  actions?: (item: T) => React.ReactNode;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
  renderGridItem?: (item: T) => React.ReactNode;
  nestedData?: NestedDataConfig<T>;
  onVisibleRowsChange?: (rows: T[]) => void;
  showCheckbox?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  onBulkDelete?: (items: T[]) => void;
  onBulkDownload?: (items: T[]) => void;
  rowOnClick?: boolean;
  onRowClick?: (item: T) => void;
  enableGridView?: boolean;
  enableTableView?: boolean;
  enableFilter?: boolean;
  enableBorder?: boolean;
  enableInputFilter?: boolean;
  enableSliderFilter?: boolean;
  filter?: SelectFilter[];
  searchKey?: string | string[];
  title?: string;
  enableDataLength?: boolean;
  allowedRolesForCheckbox?: string[];
  currentUserRole?: string;
  apiConfig?: ApiConfig;
  onDataFetched?: (data: T[], total: number) => void;
  debounceMs?: number;
  toolbarActions?: React.ReactNode;
  /** When set, only the table body scrolls within this height - the header stays pinned and the page never scrolls because of this table. */
  maxBodyHeight?: number | string;
}

function getValue(obj: any, key: string): any {
  return key.split(".").reduce((o, k) => (o ?? {})[k], obj);
}

function sortData<T>(data: T[], key: string, dir: "asc" | "desc"): T[] {
  if (!key) return data;
  return [...data].sort((a, b) => {
    const av = getValue(a, key),
      bv = getValue(b, key);
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp =
      typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const alignClass = (align?: string) =>
  align === "center"
    ? "text-center"
    : align === "right"
      ? "text-right"
      : "text-left";

function Badge({
  children,
  c,
  variant = "accent",
  dot = false,
}: {
  children: React.ReactNode;
  c: any;
  variant?: "accent" | "warning" | "danger" | "success" | "gray";
  dot?: boolean;
}) {
  const bg: Record<string, string> = {
    accent: c.primaryLight,
    warning: "#fffbeb",
    danger: "#fef2f2",
    success: "#f0fdf4",
    gray: c.primaryBackground,
  };
  const text: Record<string, string> = {
    accent: c.primary,
    warning: "#b45309",
    danger: c.danger,
    success: c.success,
    gray: c.primaryDisabledText,
  };
  const dotColor: Record<string, string> = {
    accent: c.primary,
    warning: "#f59e0b",
    danger: c.danger,
    success: c.success,
    gray: c.primaryDisabledText,
  };
  return (
    <span
      style={{ background: bg[variant], color: text[variant] }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    >
      {dot && (
        <span
          style={{ background: dotColor[variant] }}
          className="w-1.5 h-1.5 rounded-full"
        />
      )}
      {children}
    </span>
  );
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  accentColor,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accentColor?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 cursor-pointer rounded"
      style={{ accentColor }}
    />
  );
}

function SortButton({
  column,
  sortKey,
  sortDir,
  onSort,
  c,
  isDark,
}: {
  column: Column;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  c: any;
  isDark: boolean;
}) {
  const active = sortKey === column.key;
  return (
    <button
      onClick={() => onSort(column.key)}
      style={{ color: active ? c.accent : isDark ? "#f0f0f0" : "#111111" }}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer p-0 whitespace-nowrap"
    >
      {column.label}
      <span
        style={{
          color: active ? c.accent : c.primaryDisabledText,
          opacity: active ? 1 : 0.5,
        }}
      >
        {active && sortDir === "asc" ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )}
      </span>
    </button>
  );
}

function EmptyState({
  message,
  c,
  isDark,
}: {
  message: string;
  c: any;
  isDark: boolean;
}) {
  return (
    <tr>
      <td colSpan={999} className="text-center py-16 px-6">
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              background: c.primaryBackground,
              borderColor: c.primaryBorder,
              color: c.primaryDisabledText,
            }}
            className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center"
          >
            <Search size={20} />
          </div>
          <span
            style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
            className="text-sm"
          >
            {message}
          </span>
        </div>
      </td>
    </tr>
  );
}

function LoadingState({ c, isDark }: { c: any; isDark: boolean }) {
  return (
    <tr>
      <td colSpan={999} className="text-center py-16 px-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            style={{ color: c.accent }}
            className="animate-spin"
          />
          <span
            style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
            className="text-sm"
          >
            Loading data…
          </span>
        </div>
      </td>
    </tr>
  );
}

function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
  c,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  c: any;
}) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
      <div
        style={{
          background: c.background,
          border: `1px solid ${c.primaryBorder}`,
          borderRadius: 16,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
          animation: "slideUp 0.18s ease",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: c.text,
            margin: "0 0 8px",
          }}
        >
          Delete {count} {count === 1 ? "record" : "records"}?
        </h3>
        <p
          style={{
            fontSize: 13,
            color: c.textMuted ?? c.disabledText,
            margin: "0 0 24px",
            lineHeight: 1.6,
          }}
        >
          {count === 1
            ? "This record will be permanently deleted. This action cannot be undone."
            : `These ${count} records will be permanently deleted. This action cannot be undone.`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              border: `1px solid ${c.primaryBorder}`,
              background: c.background,
              color: c.text,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = c.primaryLight)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = c.background)
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid #fca5a5",
              background: "#dc2626",
              color: "#fff",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}

const DARK_THEMES = ["dark", "midnight"] as const;

// ─── Main Table ───────────────────────────────────────────────────────────────

export default function Table<
  T extends Record<string, any> = Record<string, any>,
>({
  columns = [],
  data: staticData = [],
  itemsPerPage = 10,
  actions,
  onSort,
  sortKey: externalSortKey,
  sortDirection = "asc",
  emptyMessage = "No records found",
  renderGridItem,
  nestedData,
  onVisibleRowsChange,
  showCheckbox = false,
  onSelectionChange,
  onBulkDelete,
  onBulkDownload,
  rowOnClick = false,
  onRowClick,
  enableGridView = true,
  enableTableView = true,
  enableBorder = true,
  enableInputFilter = true,
  enableFilter = true,
  filter = [],
  searchKey = "",
  title = "",
  enableDataLength = true,
  allowedRolesForCheckbox = [],
  currentUserRole = "",
  apiConfig,
  onDataFetched,
  debounceMs = 500,
  toolbarActions,
  maxBodyHeight,
}: TableProps<T>) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isDark = (DARK_THEMES as readonly string[]).includes(theme.name);

  // ── text helpers ──────────────────────────────────────────────────────────
  const textPrimary = isDark ? "#f0f0f0" : "#111111";
  const textMuted = isDark ? "#9ca3af" : "#6b7280";

  const [page, setPage] = useState<number>(1);
  const [localSortKey, setLocalSortKey] = useState<string>(
    externalSortKey ?? "",
  );
  const [localSortDir, setLocalSortDir] = useState<"asc" | "desc">(
    sortDirection,
  );
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [filterExpanded, setFilterExpanded] = useState<boolean>(false);

  const [apiData, setApiData] = useState<T[]>([]);
  const [apiTotal, setApiTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isApiMode = !!apiConfig;

  const debouncedSearch = useDebounce(search, debounceMs);
  const debouncedColumnFilters = useDebounce(columnFilters, debounceMs);

  // ── Column visibility ─────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(columns.map((col) => [col.key, !col.hiddenByDefault])),
  );
  const [showColPanel, setShowColPanel] = useState(false);
  const colPanelRef = useRef<HTMLDivElement>(null);
  const colBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        colPanelRef.current &&
        !colPanelRef.current.contains(e.target as Node) &&
        colBtnRef.current &&
        !colBtnRef.current.contains(e.target as Node)
      )
        setShowColPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visibleColumns = useMemo(
    () =>
      columns.filter((col) => {
        const isChecked = columnVisibility[col.key] ?? !col.hiddenByDefault;
        const hasFilter = !!columnFilters[col.key];
        return isChecked || hasFilter;
      }),
    [columns, columnVisibility, columnFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedColumnFilters]);

  const fetchData = useCallback(async () => {
    if (!apiConfig) return;
    setLoading(true);
    setError(null);
    try {
      const state = {
        page,
        itemsPerPage,
        sortKey: localSortKey,
        sortDir: localSortDir,
        search: debouncedSearch,
        filters: debouncedColumnFilters,
      };
      const params = apiConfig.mapParams
        ? apiConfig.mapParams(state)
        : {
            page,
            limit: itemsPerPage,
            sortKey: localSortKey,
            sortDir: localSortDir,
            search: debouncedSearch,
            ...debouncedColumnFilters,
          };
      const method = apiConfig.method ?? "GET";
      const url = apiConfig.url;

      // Use apiService (axios-based) instead of raw fetch()
      // so the Authorization Bearer token is sent automatically
      let json: any;
      if (method === "GET") {
        json = await apiService.getWithParams(url, params);
      } else {
        json = await apiService.post(url, params);
      }

      const mapped = apiConfig.mapResponse
        ? apiConfig.mapResponse(json)
        : {
            data: Array.isArray(json)
              ? json
              : (json.data ?? json.results ?? json.items ?? []),
            total: json.total ?? json.count ?? json.totalCount ?? 0,
          };
      setApiData(mapped.data);
      setApiTotal(mapped.total);
      onDataFetched?.(mapped.data, mapped.total);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [
    apiConfig,
    page,
    itemsPerPage,
    localSortKey,
    localSortDir,
    debouncedSearch,
    debouncedColumnFilters,
  ]);

  useEffect(() => {
    if (isApiMode) fetchData();
  }, [fetchData, isApiMode]);

  const filterableCols = useMemo(
    () => columns.filter((col) => col.filterable !== false),
    [columns],
  );

  const processed = useMemo<T[]>(() => {
    if (isApiMode) return apiData;
    let d = staticData;
    if (search.trim()) {
      const q = search.toLowerCase();
      const keys = Array.isArray(searchKey)
        ? searchKey
        : searchKey
          ? [searchKey]
          : columns.map((col) => col.key);
      d = d.filter((item) =>
        keys.some((k) =>
          String(getValue(item, k) ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (!val) return;
      d = d.filter((item) =>
        String(getValue(item, key) ?? "")
          .toLowerCase()
          .includes(String(val).toLowerCase()),
      );
    });
    return sortData(d, localSortKey, localSortDir);
  }, [
    isApiMode,
    apiData,
    staticData,
    search,
    searchKey,
    columns,
    columnFilters,
    localSortKey,
    localSortDir,
  ]);

  const totalRecords = isApiMode ? apiTotal : processed.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageData = isApiMode
    ? processed
    : processed.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const canShowCheckbox = useMemo<boolean>(() => {
    if (!showCheckbox) return false;
    if (!allowedRolesForCheckbox?.length) return true;
    return allowedRolesForCheckbox.includes(currentUserRole);
  }, [showCheckbox, allowedRolesForCheckbox, currentUserRole]);

  const allSelected =
    pageData.length > 0 &&
    pageData.every((_, i) => selected.has(i + (safePage - 1) * itemsPerPage));
  const someSelected =
    pageData.some((_, i) => selected.has(i + (safePage - 1) * itemsPerPage)) &&
    !allSelected;
  const selectedItems = useMemo<T[]>(
    () =>
      [...selected]
        .map((i) => {
          const pageIndex = i % itemsPerPage;
          return pageData[pageIndex];
        })
        .filter(Boolean),
    [selected, pageData, itemsPerPage],
  );
  const activeFilters = Object.entries(columnFilters).filter(([, v]) => !!v);

  const handleSort = (key: string) => {
    const newDir: "asc" | "desc" =
      localSortKey === key && localSortDir === "asc" ? "desc" : "asc";
    setLocalSortKey(key);
    setLocalSortDir(newDir);
    onSort?.(key, newDir);
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
    setSelected(new Set());
  };

  const notifySelection = (rows: Set<number>) => {
    onSelectionChange?.(
      [...rows].map((i) => pageData[i % itemsPerPage]).filter(Boolean),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    const next = new Set(selected);
    pageData.forEach((_, i) => {
      const abs = i + (safePage - 1) * itemsPerPage;
      checked ? next.add(abs) : next.delete(abs);
    });
    setSelected(next);
    notifySelection(next);
  };

  const handleSelectRow = (absIdx: number, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(absIdx) : next.delete(absIdx);
    setSelected(next);
    notifySelection(next);
  };

  const toggleRow = (index: number) => {
    const next = new Set(expandedRows);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpandedRows(next);
  };

  const setColumnFilter = (key: string, value: any) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const removeColumnFilter = (key: string) => {
    setColumnFilters((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  useEffect(() => {
    onVisibleRowsChange?.(pageData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData.map((r: any) => r?.id ?? r?.module ?? r).join(",")]);

  const iconBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${c.primaryBorder}`,
    background: c.background,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: textPrimary,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    fontSize: 12,
    border: `1px solid ${c.primaryBorder}`,
    borderRadius: 8,
    outline: "none",
    color: textPrimary,
    background: c.background,
    boxSizing: "border-box",
  };

  return (
    <div style={{ color: textPrimary, fontFamily: "inherit" }}>
      {/* ══════════════════════════════════════════════════════════════════
                FILTER BAR
            ══════════════════════════════════════════════════════════════════ */}
      {enableFilter && filterableCols.length > 0 && (
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.primaryBorder}`,
            borderRadius: 10,
            marginBottom: 12,
            overflow: "hidden",
            transition: "box-shadow 0.2s",
          }}
        >
          {/* Filter bar header (click to collapse) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
              cursor: "pointer",
              userSelect: "none",
              gap: 8,
            }}
            onClick={() => setFilterExpanded((prev) => !prev)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Search size={13} style={{ color: textMuted, flexShrink: 0 }} />
              <span
                style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}
              >
                Filters
              </span>
              {!filterExpanded && activeFilters.length > 0 && (
                <span
                  style={{
                    background: c.accent,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 99,
                    lineHeight: "16px",
                  }}
                >
                  {activeFilters.length} active
                </span>
              )}
              {filterExpanded &&
                activeFilters.map(([key, val]) => {
                  const col = columns.find((col) => col.key === key);
                  return (
                    <span
                      key={key}
                      style={{
                        background: c.background,
                        color: c.primary,
                        border: `1px solid ${c.primaryBorder}`,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: 99,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {col?.label}: <strong>{val}</strong>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeColumnFilter(key);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          padding: 0,
                          color: c.primary,
                        }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  );
                })}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              {activeFilters.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setColumnFilters({});
                    setPage(1);
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: `1px solid ${c.primaryBorder}`,
                    background: c.background,
                    color: textMuted,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = textPrimary)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = textMuted)
                  }
                >
                  <X size={10} /> Clear all
                </button>
              )}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: `1px solid ${c.primaryBorder}`,
                  background: c.background,
                  color: textMuted,
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                <ChevronDown
                  size={14}
                  style={{
                    transition: "transform 0.25s ease",
                    transform: filterExpanded
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                />
              </span>
            </div>
          </div>

          {/* Filter inputs (collapsible) */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: filterExpanded ? "1fr" : "0fr",
              transition: "grid-template-rows 0.28s ease",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  borderTop: `1px solid ${c.primaryBorder}`,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  {filterableCols.map((col) => (
                    <div key={col.key}>
                      <label
                        style={{
                          color: textMuted,
                          display: "block",
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: 4,
                        }}
                      >
                        {col.label}
                      </label>
                      {col.filterType === "select" && col.filterOptions ? (
                        <select
                          value={columnFilters[col.key] ?? ""}
                          onChange={(e) =>
                            setColumnFilter(col.key, e.target.value)
                          }
                          style={{ ...inputStyle, cursor: "pointer" }}
                        >
                          <option value="">All</option>
                          {col.filterOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <input
                            type={
                              col.filterType === "number"
                                ? "number"
                                : col.filterType === "date"
                                  ? "date"
                                  : "text"
                            }
                            value={columnFilters[col.key] ?? ""}
                            onChange={(e) =>
                              setColumnFilter(col.key, e.target.value)
                            }
                            placeholder="Filter…"
                            style={{
                              ...inputStyle,
                              paddingRight: columnFilters[col.key] ? 28 : 10,
                            }}
                          />
                          {columnFilters[col.key] && (
                            <button
                              onClick={() => removeColumnFilter(col.key)}
                              style={{
                                position: "absolute",
                                right: 7,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: textMuted,
                                display: "flex",
                                padding: 0,
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
                META BAR - record count | active filter chips | column toggle
                Sits BELOW the filter card and ABOVE the table
            ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Left: title + record count + loading spinner + active filter chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {enableDataLength && title && (
            <span style={{ color: c.text, fontWeight: 700, fontSize: 15 }}>
              {title}
            </span>
          )}
          {enableDataLength && (
            <Badge c={c} variant="accent">
              {totalRecords} {totalRecords === 1 ? "record" : "records"}
            </Badge>
          )}
          {isApiMode && loading && (
            <Loader2
              size={14}
              style={{ color: c.accent }}
              className="animate-spin"
            />
          )}
          {activeFilters.map(([key, val]) => {
            const col = columns.find((col) => col.key === key);
            return (
              <span
                key={key}
                style={{ background: c.primaryLight, color: c.text }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {col?.label}: <strong>{val}</strong>
                <button
                  onClick={() => removeColumnFilter(key)}
                  style={{
                    color: c.primary,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>

        {/* Right: bulk actions | toolbarActions | view toggles | refresh | search input + column visibility toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Selected badge */}
          {selectedItems.length > 0 && (
            <Badge c={c} variant="warning">
              {selectedItems.length} selected
            </Badge>
          )}

          {/* Bulk delete */}
          {onBulkDelete && selectedItems.length > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background: "#fef2f2",
                color: c.danger,
                border: `1px solid #fecaca`,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fee2e2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fef2f2")
              }
            >
              <Trash2 size={14} /> Delete ({selectedItems.length})
            </button>
          )}

          {/* Bulk download */}
          {onBulkDownload && selectedItems.length > 0 && (
            <button
              onClick={() => onBulkDownload(selectedItems)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                background: c.primaryLight,
                color: c.primary,
                border: `1px solid ${c.primaryBorder}`,
              }}
            >
              <Download size={14} /> Export ({selectedItems.length})
            </button>
          )}

          {/* External select filters */}
          {filter.map((f) => (
            <select
              key={f.key}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                border: `1px solid ${c.primaryBorder}`,
                background: c.background,
                color: textPrimary,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">{f.placeholder}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Custom toolbar slot (Export buttons etc.) */}
          {toolbarActions}

          {/* View toggles */}
          {(enableTableView || enableGridView) && (
            <div
              style={{
                border: `1px solid ${c.primaryBorder}`,
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
              }}
            >
              {enableTableView && (
                <button
                  onClick={() => setViewMode("table")}
                  title="Table view"
                  style={{
                    padding: "6px 10px",
                    border: "none",
                    cursor: "pointer",
                    background: viewMode === "table" ? c.accent : c.background,
                    color: viewMode === "table" ? "#fff" : textPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <TableIcon size={16} />
                </button>
              )}
              {enableGridView && (
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  style={{
                    padding: "6px 10px",
                    border: "none",
                    cursor: "pointer",
                    background: viewMode === "grid" ? c.accent : c.background,
                    color: viewMode === "grid" ? "#fff" : textPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <LayoutGrid size={16} />
                </button>
              )}
            </div>
          )}

          {/* Refresh (API mode only) */}
          {isApiMode && (
            <button
              onClick={fetchData}
              disabled={loading}
              title="Refresh data"
              style={{ ...iconBtnStyle, opacity: loading ? 0.5 : 1 }}
            >
              <Loader2
                size={15}
                style={{ color: textPrimary }}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          )}

          {enableInputFilter && (
            <div style={{ position: "relative", width: 200 }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: textMuted,
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  ...inputStyle,
                  paddingLeft: 28,
                  paddingRight: search ? 28 : 10,
                  width: "100%",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 7,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: textMuted,
                    display: "flex",
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          <div style={{ position: "relative" }}>
            <button
              ref={colBtnRef}
              onClick={() => setShowColPanel((prev) => !prev)}
              title="Toggle columns"
              style={{
                ...iconBtnStyle,
                background: showColPanel ? c.primaryLight : c.background,
                color: showColPanel ? c.accent : isDark ? "#f0f0f0" : "#332c2c",
              }}
            >
              <Columns4 size={16} />
            </button>

            {showColPanel && (
              <div
                ref={colPanelRef}
                style={{
                  position: "absolute",
                  top: 38,
                  right: 0,
                  zIndex: 100,
                  background: c.background,
                  border: `1px solid ${c.primaryBorder}`,
                  borderRadius: 12,
                  padding: "12px 0",
                  minWidth: 210,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              >
                {/* Panel header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 14px 10px",
                    borderBottom: `1px solid ${c.primaryBorder}`,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: textPrimary,
                    }}
                  >
                    Columns
                  </span>
                  <button
                    onClick={() =>
                      setColumnVisibility(
                        Object.fromEntries(
                          columns.map((col) => [col.key, !col.hiddenByDefault]),
                        ),
                      )
                    }
                    style={{
                      fontSize: 11,
                      color: c.accent,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    Reset
                  </button>
                </div>

                {/* Column checkboxes */}
                {columns.map((col) => (
                  <label
                    key={col.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontSize: 13,
                      color: textPrimary,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = c.primaryLight)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        columnVisibility[col.key] ?? !col.hiddenByDefault
                      }
                      onChange={(e) =>
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [col.key]: e.target.checked,
                        }))
                      }
                      style={{
                        accentColor: c.accent,
                        width: 14,
                        height: 14,
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {col.icon && (
                        <span style={{ opacity: 0.6 }}>{col.icon}</span>
                      )}
                      {col.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: `1px solid #fecaca`,
            color: c.danger,
            borderRadius: 8,
          }}
          className="mb-3 px-4 py-2.5 text-sm flex justify-between items-center"
        >
          ⚠️ {error}
          <button
            onClick={fetchData}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: c.danger,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
                GRID VIEW
            ══════════════════════════════════════════════════════════════════ */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3">
          {pageData.length === 0 ? (
            <div
              style={{ color: textMuted }}
              className="col-span-full text-center py-12 text-sm"
            >
              {loading ? "Loading…" : emptyMessage}
            </div>
          ) : (
            pageData.map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  if (rowOnClick) onRowClick?.(item);
                }}
                style={{ cursor: rowOnClick ? "pointer" : "default" }}
              >
                {renderGridItem ? (
                  renderGridItem(item)
                ) : (
                  <div
                    style={{
                      background: c.background,
                      border: `1px solid ${c.primaryBorder}`,
                    }}
                    className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {visibleColumns.map((col) => (
                        <div key={col.key}>
                          <div
                            style={{ color: textMuted }}
                            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                          >
                            {col.icon && <span>{col.icon}</span>}
                            {col.label}
                          </div>
                          <div style={{ color: textPrimary }} className="text-sm">
                            {col.render
                              ? col.render(item)
                              : (getValue(item, col.key) ?? "-")}
                          </div>
                        </div>
                      ))}
                    </div>
                    {actions && (
                      <div
                        className="flex justify-end mt-3 pt-3"
                        style={{ borderTop: `1px solid ${c.primaryBorder}` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actions(item)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
                   TABLE VIEW
                ══════════════════════════════════════════════════════════════ */
        <div
          style={{
            background: c.background,
            border: `1px solid ${c.primaryBorder}`,
          }}
          className="rounded-xl shadow-ipc-sm overflow-hidden"
        >
          <div className="overflow-x-auto" style={maxBodyHeight ? { maxHeight: maxBodyHeight, overflowY: "auto" } : undefined}>
            <table className="w-full border-collapse text-[13px]">
              <thead style={{ position: "sticky", top: 0, zIndex: 5, background: c.primaryLight }}>
                <tr style={{ background: c.primaryLight }}>
                  {canShowCheckbox && (
                    <th
                      style={{
                        borderBottom: `2px solid ${c.primaryBorder}`,
                        width: 44,
                      }}
                      className="px-4 py-3"
                    >
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        accentColor={c.accent}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                  )}
                  {nestedData && (
                    <th
                      style={{ borderBottom: `2px solid ${c.primaryBorder}` }}
                      className="w-11 px-4 py-3"
                    />
                  )}
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        borderBottom: `2px solid ${c.primaryBorder}`,
                        width: col.width,
                      }}
                      className={cn(
                        "px-4 py-3 whitespace-nowrap",
                        alignClass(col.align),
                      )}
                    >
                      {col.sortable !== false ? (
                        <SortButton
                          column={col}
                          sortKey={localSortKey}
                          sortDir={localSortDir}
                          onSort={handleSort}
                          c={c}
                          isDark={isDark}
                        />
                      ) : (
                        <span
                          style={{ color: isDark ? "#f0f0f0" : "#111111" }}
                          className="text-[11px] font-semibold uppercase tracking-wider"
                        >
                          {col.label}
                        </span>
                      )}
                    </th>
                  ))}
                  {actions && (
                    <th
                      style={{ borderBottom: `2px solid ${c.primaryBorder}` }}
                      className="px-4 py-3 whitespace-nowrap text-right"
                    >
                      <span
                        style={{ color: isDark ? "#f0f0f0" : "#111111" }}
                        className="text-[11px] font-semibold uppercase tracking-wider"
                      >
                        Actions
                      </span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <LoadingState c={c} isDark={isDark} />
                ) : pageData.length === 0 ? (
                  <EmptyState message={emptyMessage} c={c} isDark={isDark} />
                ) : (
                  pageData.map((item, i) => {
                    const absIdx = i + (safePage - 1) * itemsPerPage;
                    const isSel = selected.has(absIdx);
                    const isExp = expandedRows.has(absIdx);
                    return (
                      <React.Fragment key={absIdx}>
                        <tr
                          onClick={() => {
                            if (rowOnClick) onRowClick?.(item);
                          }}
                          style={{
                            background: isSel
                              ? c.primaryLight
                              : i % 2 === 1
                                ? c.canvas
                                : c.surface,
                            borderTop: enableBorder
                              ? `1px solid ${c.primaryBorder}`
                              : "none",
                            cursor: rowOnClick ? "pointer" : "default",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSel)
                              e.currentTarget.style.background = c.primaryLight;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isSel
                              ? c.primaryLight
                              : i % 2 === 1
                                ? c.canvas
                                : c.surface;
                          }}
                          className="transition-colors"
                        >
                          {canShowCheckbox && (
                            <td
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSel}
                                accentColor={c.accent}
                                onChange={(e) =>
                                  handleSelectRow(absIdx, e.target.checked)
                                }
                              />
                            </td>
                          )}
                          {nestedData && (
                            <td
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => toggleRow(absIdx)}
                                style={{
                                  border: `1px solid ${c.primaryBorder}`,
                                  background: c.primaryLight,
                                  color: textMuted,
                                }}
                                className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors"
                              >
                                {isExp ? (
                                  <ChevronUp size={13} />
                                ) : (
                                  <ChevronRight size={13} />
                                )}
                              </button>
                            </td>
                          )}
                          {visibleColumns.map((col) => (
                            <td
                              key={col.key}
                              style={{ color: textPrimary }}
                              className={cn(
                                "px-4 py-3 text-sm",
                                alignClass(col.align),
                              )}
                            >
                              {col.render
                                ? col.render(item)
                                : (getValue(item, col.key) ?? "-")}
                            </td>
                          ))}
                          {actions && (
                            <td
                              className="px-4 py-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {actions(item)}
                            </td>
                          )}
                        </tr>

                        {/* Nested table row */}
                        {nestedData && isExp && (
                          <tr>
                            <td
                              colSpan={
                                visibleColumns.length +
                                (canShowCheckbox ? 1 : 0) +
                                1
                              }
                              style={{ background: c.primaryLight }}
                              className="pl-12"
                            >
                              <table className="w-full border-collapse text-xs">
                                <thead>
                                  <tr>
                                    {nestedData.columns.map((col) => (
                                      <th
                                        key={col.key}
                                        style={{
                                          borderBottom: `1px solid ${c.primaryBorder}`,
                                          color: textMuted,
                                        }}
                                        className={cn(
                                          "px-4 py-2 text-[10px] font-semibold uppercase tracking-wider",
                                          alignClass(col.align),
                                        )}
                                      >
                                        {col.label}
                                      </th>
                                    ))}
                                    {nestedData.actions && (
                                      <th
                                        style={{
                                          borderBottom: `1px solid ${c.primaryBorder}`,
                                          color: textMuted,
                                        }}
                                        className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider"
                                      >
                                        Actions
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(getValue(item, nestedData.key) ?? [])
                                    .length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={999}
                                        style={{ color: textMuted }}
                                        className="px-4 py-3 text-xs"
                                      >
                                        {nestedData.emptyMessage ??
                                          "No data found"}
                                      </td>
                                    </tr>
                                  ) : (
                                    (
                                      getValue(item, nestedData.key) as any[]
                                    ).map((nestedItem, ni) => (
                                      <tr
                                        key={ni}
                                        style={{
                                          borderTop: `1px solid ${c.primaryBorder}`,
                                        }}
                                      >
                                        {nestedData.columns.map((col) => (
                                          <td
                                            key={col.key}
                                            style={{ color: textPrimary }}
                                            className={cn(
                                              "px-4 py-2 text-xs",
                                              alignClass(col.align),
                                            )}
                                          >
                                            {col.render
                                              ? col.render(nestedItem)
                                              : (getValue(
                                                  nestedItem,
                                                  col.key,
                                                ) ?? "-")}
                                          </td>
                                        ))}
                                        {nestedData.actions && (
                                          <td className="px-4 py-2 text-right">
                                            {nestedData.actions(nestedItem)}
                                          </td>
                                        )}
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalRecords > itemsPerPage && (
            <div
              style={{
                borderTop: `1px solid ${c.primaryBorder}`,
                background: c.primaryLight,
              }}
              className="flex items-center justify-between px-5 py-3 gap-2 flex-wrap"
            >
              <span style={{ color: textMuted }} className="text-xs">
                Showing{" "}
                <strong style={{ color: textPrimary }}>
                  {(safePage - 1) * itemsPerPage + 1}
                </strong>
                –
                <strong style={{ color: textPrimary }}>
                  {Math.min(safePage * itemsPerPage, totalRecords)}
                </strong>{" "}
                of{" "}
                <strong style={{ color: textPrimary }}>{totalRecords}</strong>
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    {
                      icon: <ChevronsLeft size={14} />,
                      fn: () => goToPage(1),
                      off: safePage === 1,
                    },
                    {
                      icon: <ChevronLeft size={14} />,
                      fn: () => goToPage(safePage - 1),
                      off: safePage === 1,
                    },
                    {
                      icon: <ChevronRight size={14} />,
                      fn: () => goToPage(safePage + 1),
                      off: safePage === totalPages,
                    },
                    {
                      icon: <ChevronsRight size={14} />,
                      fn: () => goToPage(totalPages),
                      off: safePage === totalPages,
                    },
                  ] as const
                ).map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={btn.fn}
                    disabled={btn.off}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: `1px solid ${c.primaryBorder}`,
                      background: c.background,
                      cursor: btn.off ? "not-allowed" : "pointer",
                      opacity: btn.off ? 0.4 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: textMuted,
                    }}
                  >
                    {btn.icon}
                  </button>
                ))}
                <span style={{ color: textMuted }} className="text-xs ml-2">
                  Page{" "}
                  <strong style={{ color: textPrimary }}>{safePage}</strong> /{" "}
                  {totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk delete confirmation */}
      {showDeleteModal && onBulkDelete && (
        <DeleteConfirmModal
          count={selectedItems.length}
          c={c}
          onConfirm={() => {
            onBulkDelete(selectedItems);
            setSelected(new Set());
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
