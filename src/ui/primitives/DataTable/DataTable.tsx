import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import React from "react";
import {
  Search, X, Filter, Trash2, Download,
  Table as TableIcon, LayoutGrid,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, SlidersHorizontal, Loader2,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { useSRAnnounce } from "@/app/ScreenReaderProvider"; // ← new

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface DataTableProps<T = any> {
  columns: Column<T>[] | any;
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
  searchKey?: string;
  title?: string;
  enableDataLength?: boolean;
  allowedRolesForCheckbox?: string[];
  currentUserRole?: string;
  apiConfig?: ApiConfig;
  onDataFetched?: (data: T[], total: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue(obj: any, key: string): any {
  return key.split(".").reduce((o, k) => (o ?? {})[k], obj);
}

function sortData<T>(data: T[], key: string, dir: "asc" | "desc"): T[] {
  if (!key) return data;
  return [...data].sort((a, b) => {
    const av = getValue(a, key), bv = getValue(b, key);
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const alignClass = (align?: string) =>
  align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

const numericCellClass = (column: Column, value: unknown) =>
  column.align === "right" || typeof value === "number" ? "cell-numeric" : "";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({
  children, c, variant = "accent", dot = false,
}: {
  children: React.ReactNode;
  c: any;
  variant?: "accent" | "warning" | "danger" | "success" | "gray";
  dot?: boolean;
}) {
  const bg: Record<string, string> = {
    accent: c.primaryLight, warning: "#fffbeb", danger: "#fef2f2",
    success: "#f0fdf4", gray: c.primaryBackground,
  };
  const text: Record<string, string> = {
    accent: c.primary, warning: "#b45309", danger: c.danger,
    success: c.success, gray: c.primarytextMuted,
  };
  const dotColor: Record<string, string> = {
    accent: c.primary, warning: "#f59e0b", danger: c.danger,
    success: c.success, gray: c.primarytextMuted,
  };
  return (
    <span
      style={{ background: bg[variant], color: text[variant] }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    >
      {dot && <span aria-hidden="true" style={{ background: dotColor[variant] }} className="w-1.5 h-1.5 rounded-full" />}
      {children}
    </span>
  );
}

function Checkbox({
  checked, indeterminate, onChange, accentColor, label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accentColor?: string;
  label: string; // ── a11y: always required now ──
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
      // ── a11y: every checkbox must have a label ──
      aria-label={label}
      className="w-4 h-4 cursor-pointer rounded"
      style={{ accentColor }}
    />
  );
}

function SortButton({
  column, sortKey, sortDir, onSort, c,
}: {
  column: Column;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  c: any;
}) {
  const active = sortKey === column.key;
  // ── a11y: aria-sort only valid on <th>, so pass it up via data attr ──
  // actual aria-sort is set on the <th> in the table header below
  // const nextDir = active && sortDir === "asc" ? "descending" : "ascending";
  return (
    <button
      onClick={() => onSort(column.key)}
      // ── a11y: describes exactly what will happen on click ──
      aria-label={`Sort by ${column.label}, ${active ? (sortDir === "asc" ? "currently ascending, click for descending" : "currently descending, click for ascending") : "click to sort ascending"}`}
      style={{ color: active ? c.accent : c.text }}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer p-0 whitespace-nowrap"
    >
      {column.label}
      <span aria-hidden="true" style={{ color: active ? c.accent : c.primarytextMuted, opacity: active ? 1 : 0.5 }}>
        {active && sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </span>
    </button>
  );
}

function EmptyState({ message, c }: { message: string; c: any }) {
  return (
    <tr>
      <td colSpan={999} className="text-center py-16 px-6">
        <div className="flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            style={{ background: c.primaryBackground, borderColor: c.primaryBorder, color: c.primarytextMuted }}
            className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center"
          >
            <Filter size={20} />
          </div>
          <span style={{ color: c.primarytextMuted }} className="text-sm">{message}</span>
        </div>
      </td>
    </tr>
  );
}

function LoadingState({ c }: { c: any }) {
  return (
    <tr>
      {/* ── a11y: role=status announces loading without interrupting ── */}
      <td colSpan={999} className="text-center py-16 px-6" role="status">
        <div className="flex flex-col items-center gap-3">
          <Loader2 aria-hidden="true" size={28} style={{ color: c.accent }} className="animate-spin" />
          <span style={{ color: c.primarytextMuted }} className="text-sm">Loading data…</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, any> = Record<string, any>>({
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
  enableFilter = true,
  enableBorder = true,
  enableInputFilter = true,
  enableSliderFilter = true,
  filter = [],
  searchKey = "",
  title = "",
  enableDataLength = true,
  allowedRolesForCheckbox = [],
  currentUserRole = "",
  apiConfig,
  onDataFetched,
}: DataTableProps<T>) {

  const { theme } = useTheme();
  const c = theme.colors;
  const announce = useSRAnnounce(); // ── a11y: screen reader announcer ──

  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState<number>(1);
  const [localSortKey, setLocalSortKey] = useState<string>(externalSortKey ?? "");
  const [localSortDir, setLocalSortDir] = useState<"asc" | "desc">(sortDirection);
  const [search, setSearch] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // ── API State ──────────────────────────────────────────────────────────────
  const [apiData, setApiData] = useState<T[]>([]);
  const [apiTotal, setApiTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isApiMode = !!apiConfig;

  // ── Stable IDs for aria relationships ─────────────────────────────────────
  const tableId = useRef(`datatable-${Math.random().toString(36).slice(2)}`).current;
  const liveRegionId = `${tableId}-live`;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!apiConfig) return;
    setLoading(true);
    setError(null);
    try {
      const state = { page, itemsPerPage, sortKey: localSortKey, sortDir: localSortDir, search, filters: columnFilters };
      const params = apiConfig.mapParams ? apiConfig.mapParams(state)
        : { page, limit: itemsPerPage, sortKey: localSortKey, sortDir: localSortDir, search, ...columnFilters };

      const method = apiConfig.method ?? "GET";
      let url = apiConfig.url;
      const fetchOptions: RequestInit = {
        method,
        headers: { "Content-Type": "application/json", ...(apiConfig.headers ?? {}) },
      };

      if (method === "GET") {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== "" && v != null).map(([k, v]) => [k, String(v)])
        ).toString();
        if (qs) url += `?${qs}`;
      } else {
        fetchOptions.body = JSON.stringify(params);
      }

      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      const mapped = apiConfig.mapResponse ? apiConfig.mapResponse(json) : {
        data: Array.isArray(json) ? json : (json.data ?? json.results ?? json.items ?? []),
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
  }, [apiConfig, page, itemsPerPage, localSortKey, localSortDir, search, columnFilters]);

  useEffect(() => { if (isApiMode) fetchData(); }, [fetchData, isApiMode]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const processed = useMemo<T[]>(() => {
    if (isApiMode) return apiData;
    let d = staticData;
    if (searchKey && search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(item => String(getValue(item, searchKey) ?? "").toLowerCase().includes(q));
    }
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (!val) return;
      d = d.filter(item => String(getValue(item, key) ?? "").toLowerCase().includes(String(val).toLowerCase()));
    });
    return sortData(d, localSortKey, localSortDir);
  }, [isApiMode, apiData, staticData, search, searchKey, columnFilters, localSortKey, localSortDir]);

  const totalRecords = isApiMode ? apiTotal : processed.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageData = isApiMode ? processed : processed.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  // ── a11y: announce row count when data, filters, or page changes ──────────
  useEffect(() => {
    if (loading) return;
    const from = (safePage - 1) * itemsPerPage + 1;
    const to = Math.min(safePage * itemsPerPage, totalRecords);
    const msg = totalRecords === 0
      ? emptyMessage
      : `Showing ${from} to ${to} of ${totalRecords} ${totalRecords === 1 ? "record" : "records"}`;
    announce(msg, "polite");
  }, [totalRecords, safePage, loading]);

  // ── Role-gated checkboxes ──────────────────────────────────────────────────
  const canShowCheckbox = useMemo<boolean>(() => {
    if (!showCheckbox) return false;
    if (!allowedRolesForCheckbox?.length) return true;
    return allowedRolesForCheckbox.includes(currentUserRole);
  }, [showCheckbox, allowedRolesForCheckbox, currentUserRole]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected = pageData.length > 0 && pageData.every((_, i) => selected.has(i + (safePage - 1) * itemsPerPage));
  const someSelected = pageData.some((_, i) => selected.has(i + (safePage - 1) * itemsPerPage)) && !allSelected;
  const selectedItems = useMemo<T[]>(() => [...selected].map(i => pageData[i % itemsPerPage]).filter(Boolean), [selected, pageData, itemsPerPage]);
  const activeFilters = Object.entries(columnFilters).filter(([, v]) => !!v);
  const filterableCols = columns.filter((col: any) => col.filterable !== false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    const newDir: "asc" | "desc" = localSortKey === key && localSortDir === "asc" ? "desc" : "asc";
    setLocalSortKey(key); setLocalSortDir(newDir); onSort?.(key, newDir); setPage(1);
    // ── a11y: announce sort change ──
    const col = columns.find((c: any) => c.key === key);
    announce(`Sorted by ${col?.label ?? key}, ${newDir === "asc" ? "ascending" : "descending"}`, "polite");
  };

  // const goToPage = (p: number) => {
  //   setPage(Math.max(1, Math.min(p, totalPages)));
  //   setSelected(new Set());
  // };
  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));

    setPage(next);
    setSelected(new Set());

    // ✅ A11Y
    announce(`Page ${next} loaded`);
  };
  const notifySelection = (rows: Set<number>) => {
    onSelectionChange?.([...rows].map(i => pageData[i % itemsPerPage]).filter(Boolean));
  };

  const handleSelectAll = (checked: boolean) => {
    const next = new Set(selected);
    pageData.forEach((_, i) => {
      const abs = i + (safePage - 1) * itemsPerPage;
      checked ? next.add(abs) : next.delete(abs);
    });
    setSelected(next);
    notifySelection(next);
    // ── a11y: announce selection change ──
    announce(checked ? `All ${pageData.length} rows selected` : "All rows deselected", "polite");
  };

  const handleSelectRow = (absIdx: number, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(absIdx) : next.delete(absIdx);
    setSelected(next);
    notifySelection(next);
  };

  // const toggleRow = (index: number) => {
  //   const next = new Set(expandedRows);
  //   next.has(index) ? next.delete(index) : next.add(index);
  //   setExpandedRows(next);
  // };
  const toggleRow = (index: number) => {
    const next = new Set(expandedRows);

    const isExpanded = next.has(index);

    isExpanded ? next.delete(index) : next.add(index);

    setExpandedRows(next);

    // ✅ A11Y
    announce(isExpanded ? "Row collapsed" : "Row expanded");
  };
  // const setColumnFilter = (key: string, value: any) => {
  //   setColumnFilters(prev => ({ ...prev, [key]: value }));
  //   setPage(1);
  // };
  const setColumnFilter = (key: string, value: any) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);

    // ✅ A11Y
    const col = columns.find((c: any) => c.key === key);
    announce(
      value
        ? `Filter applied on ${col?.label}: ${value}`
        : `Filter cleared for ${col?.label}`
    );
  };
  const removeColumnFilter = (key: string) => {
    setColumnFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  useEffect(() => {
    onVisibleRowsChange?.(pageData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pageData.map((r: any) => r?.id ?? r))]);

  // ── Inline style builders ──────────────────────────────────────────────────
  const toolbarBtnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 12px", borderRadius: 8, fontSize: 12,
    fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: `1px solid ${c.primaryBorder}`,
    background: c.background,
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: c.text,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // ── a11y: aria-busy tells SR data is loading ──
    <div style={{ color: c.text, fontFamily: "inherit" }} aria-busy={loading}>

      {/* ── a11y: visually hidden live region for row count announcements ── */}
      <div
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">

        {/* Left */}
        <div className="flex items-center gap-2 flex-wrap">
          {enableDataLength && title && (
            <span style={{ color: c.text }} className="font-bold text-[15px]">{title}</span>
          )}
          {enableDataLength && (
            <Badge c={c} variant="accent">
              {totalRecords} {totalRecords === 1 ? "record" : "records"}
            </Badge>
          )}
          {isApiMode && loading && (
            <Loader2 aria-hidden="true" size={14} style={{ color: c.accent }} className="animate-spin" />
          )}
          {selectedItems.length > 0 && (
            <Badge c={c} variant="warning">{selectedItems.length} selected</Badge>
          )}
          {activeFilters.map(([key, val]) => {
            const col = columns.find((col: any) => col.key === key);
            return (
              <span key={key}
                style={{ background: c.primaryLight, color: c.primary }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {col?.label}: <strong>{val}</strong>
                <button
                  onClick={() => removeColumnFilter(key)}
                  aria-label={`Remove filter: ${col?.label}`}
                  style={{ color: c.primary, background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Bulk delete */}
          {onBulkDelete && selectedItems.length > 0 && (
            <button
              onClick={() => { onBulkDelete(selectedItems); setSelected(new Set()); }}
              aria-label={`Delete ${selectedItems.length} selected items`}
              style={{ ...toolbarBtnBase, background: "#fef2f2", color: c.danger, border: `1px solid #fecaca` }}
            >
              <Trash2 size={14} aria-hidden="true" /> Delete ({selectedItems.length})
            </button>
          )}

          {/* Bulk download */}
          {onBulkDownload && selectedItems.length > 0 && (
            <button
              onClick={() => onBulkDownload(selectedItems)}
              aria-label={`Export ${selectedItems.length} selected items`}
              style={{ ...toolbarBtnBase, background: c.primaryLight, color: c.primary, border: `1px solid ${c.primaryBorder}` }}
            >
              <Download size={14} aria-hidden="true" /> Export ({selectedItems.length})
            </button>
          )}

          {/* External select filters */}
          {filter.map(f => (
            <select
              key={f.key}
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              // ── a11y: select needs a label ──
              aria-label={f.placeholder}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 12,
                border: `1px solid ${c.primaryBorder}`,
                background: c.background, color: c.text,
                cursor: "pointer", outline: "none",
              }}
            >
              <option value="">{f.placeholder}</option>
              {f.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ))}

          {/* View mode toggles */}
          {(enableTableView || enableGridView) && (
            // ── a11y: group the two toggle buttons ──
            <div
              role="group"
              aria-label="View mode"
              style={{ border: `1px solid ${c.primaryBorder}`, borderRadius: 8, overflow: "hidden", display: "flex" }}
            >
              {enableTableView && (
                <button
                  // onClick={() => setViewMode("table")}
                  onClick={() => {
                    setViewMode("table");
                    announce("Table view enabled");
                  }}
                  aria-label="Table view"
                  aria-pressed={viewMode === "table"}
                  style={{
                    padding: "6px 10px", border: "none", cursor: "pointer",
                    background: viewMode === "table" ? c.accent : c.background,
                    color: viewMode === "table" ? "#fff" : c.text,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <TableIcon size={16} aria-hidden="true" />
                </button>
              )}
              {enableGridView && (
                <button
                  // onClick={() => setViewMode("grid")}
                  onClick={() => {
                    setViewMode("grid");
                    announce("Grid view enabled");
                    }}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  style={{
                    padding: "6px 10px", border: "none", cursor: "pointer",
                    background: viewMode === "grid" ? c.accent : c.background,
                    color: viewMode === "grid" ? "#fff" : c.text,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Search */}
          {enableInputFilter && (
            <div className="flex items-center gap-1.5">
              {showSearch ? (
                <>
                  <input
                    autoFocus
                    value={search}
                    // onChange={e => { setSearch(e.target.value); setPage(1); }}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(1);
                      // ✅ A11Y
                      announce(`Searching for ${e.target.value || "all records"}`);
                    }}
                    placeholder={`Search by ${searchKey || "keyword"}…`}
                    // ── a11y: descriptive label ──
                    aria-label={`Search by ${searchKey || "keyword"}`}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 13,
                      border: `2px solid ${c.accent}`, outline: "none",
                      color: c.text, background: c.background,
                      width: 210, boxShadow: `0 0 0 3px ${c.primaryLight}`,
                    }}
                  />
                  <button
                    onClick={() => { setSearch(""); setShowSearch(false); }}
                    aria-label="Clear search"
                    style={iconBtnStyle}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  aria-label="Open search"
                  style={iconBtnStyle}
                >
                  <Search size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Filter panel button */}
          {(enableFilter || enableSliderFilter) && (
            <div className="relative">
              <button
                onClick={() => setFilterOpen(o => !o)}
                aria-expanded={filterOpen}
                aria-haspopup="true"
                aria-label={activeFilters.length ? `Filters, ${activeFilters.length} active` : "Open filters"}
                style={{
                  ...toolbarBtnBase,
                  background: activeFilters.length ? c.primaryLight : c.background,
                  color: activeFilters.length ? c.primary : c.text,
                  border: `1px solid ${c.primaryBorder}`,
                }}
              >
                {enableSliderFilter
                  ? <SlidersHorizontal size={14} aria-hidden="true" />
                  : <Filter size={14} aria-hidden="true" />
                }
                {activeFilters.length ? `Filters (${activeFilters.length})` : "Filter"}
              </button>

              {filterOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
                  background: c.background, border: `1px solid ${c.primaryBorder}`,
                  borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.09)",
                  padding: 16, width: 256,
                }}>
                  <div className="flex justify-between items-center mb-3">
                    <span style={{ color: c.text }} className="font-semibold text-sm">Column Filters</span>
                    <button
                      onClick={() => { setColumnFilters({}); setPage(1); }}
                      aria-label="Clear all filters"
                      style={{ color: c.accent, background: "none", border: "none", cursor: "pointer", fontSize: 11 }}
                    >
                      Clear all
                    </button>
                  </div>
                  {filterableCols.map((col: any) => (
                    <div key={col.key} className="mb-2.5">
                      {/* ── a11y: label properly linked to input via htmlFor ── */}
                      <label
                        htmlFor={`filter-${col.key}`}
                        style={{ color: c.textMuted }}
                        className="block text-[10px] font-semibold uppercase tracking-wider mb-1"
                      >
                        {col.label}
                      </label>
                      {col.filterType === "select" && col.filterOptions ? (
                        <select
                          id={`filter-${col.key}`}
                          value={columnFilters[col.key] || ""}
                          onChange={e => setColumnFilter(col.key, e.target.value)}
                          style={{
                            width: "100%", padding: "6px 10px", fontSize: 12, boxSizing: "border-box",
                            border: `1px solid ${c.primaryBorder}`, borderRadius: 8,
                            outline: "none", color: c.text, background: c.primaryLight,
                          }}
                        >
                          <option value="">All</option>
                          {col.filterOptions.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`filter-${col.key}`}
                          type={col.filterType === "number" ? "number" : col.filterType === "date" ? "date" : "text"}
                          value={columnFilters[col.key] || ""}
                          onChange={e => setColumnFilter(col.key, e.target.value)}
                          placeholder={`Filter ${col.label}…`}
                          style={{
                            width: "100%", padding: "6px 10px", fontSize: 12, boxSizing: "border-box",
                            border: `1px solid ${c.primaryBorder}`, borderRadius: 8,
                            outline: "none", color: c.text, background: c.primaryLight,
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {filterableCols.length === 0 && (
                    <p style={{ color: c.textMuted }} className="text-xs">No filterable columns.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* API refresh */}
          {isApiMode && (
            <button
              onClick={fetchData}
              disabled={loading}
              aria-label="Refresh data"
              style={{ ...iconBtnStyle, opacity: loading ? 0.5 : 1 }}
            >
              <Loader2 size={15} aria-hidden="true" style={{ color: c.textMuted }} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* ── a11y: role=alert interrupts SR immediately for errors ── */}
      {error && (
        <div
          role="alert"
          style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: c.danger, borderRadius: 8 }}
          className="mb-3 px-4 py-2.5 text-sm flex justify-between items-center"
        >
          ⚠️ {error}
          <button
            onClick={fetchData}
            aria-label="Retry loading data"
            style={{ background: "none", border: "none", cursor: "pointer", color: c.danger, fontWeight: 600, fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Grid View ── */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageData.length === 0 ? (
            <div style={{ color: c.textMuted }} className="col-span-full text-center py-12 text-sm">
              {loading ? "Loading…" : emptyMessage}
            </div>
          ) : pageData.map((item, i) => (
            <div key={i}>
              {renderGridItem ? renderGridItem(item) : (
                <div
                  style={{ background: c.background, border: `1px solid ${c.primaryBorder}` }}
                  className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {columns.map((col: any) => (
                    <div key={col.key} className="mb-2">
                      <div style={{ color: c.textMuted }}
                        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                        {col.icon && <span aria-hidden="true">{col.icon}</span>}
                        {col.label}
                      </div>
                      <div style={{ color: c.text }} className="text-sm">
                        {col.render ? col.render(item) : getValue(item, col.key) ?? "-"}
                      </div>
                    </div>
                  ))}
                  {actions && <div className="mt-3 flex justify-end">{actions(item)}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Table View ── */
        <div
          style={{ background: c.background, border: `1px solid ${c.primaryBorder}` }}
          className="rounded-xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            {/* ── a11y: table label + described by live region ── */}
            <table
              className="w-full border-collapse text-[13px]"
              aria-label={title || "Data table"}
              aria-describedby={liveRegionId}
              aria-busy={loading}
            >
              <thead>
                <tr style={{ background: c.primaryLight }}>
                  {canShowCheckbox && (
                    // ── a11y: scope="col" on every <th> ──
                    <th scope="col" style={{ borderBottom: `2px solid ${c.primaryBorder}` }} className="w-11 px-4 py-3">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        accentColor={c.accent}
                        // ── a11y: descriptive label for select-all ──
                        label={allSelected ? "Deselect all rows" : "Select all rows on this page"}
                        onChange={e => handleSelectAll(e.target.checked)}
                      />
                    </th>
                  )}
                  {nestedData && (
                    <th scope="col" style={{ borderBottom: `2px solid ${c.primaryBorder}` }} className="w-11 px-4 py-3">
                      {/* ── a11y: visually empty but labelled for SR ── */}
                      <span className="sr-only">Expand row</span>
                    </th>
                  )}
                  {columns.map((col: any) => (
                    <th
                      key={col.key}
                      scope="col"
                      // ── a11y: aria-sort on the <th>, not the button inside ──
                      aria-sort={
                        localSortKey === col.key
                          ? localSortDir === "asc" ? "ascending" : "descending"
                          : col.sortable !== false ? "none" : undefined
                      }
                      style={{ borderBottom: `2px solid ${c.primaryBorder}`, width: col.width }}
                      className={cn("px-4 py-3 whitespace-nowrap", alignClass(col.align))}
                    >
                      {col.sortable !== false
                        ? <SortButton column={col} sortKey={localSortKey} sortDir={localSortDir} onSort={handleSort} c={c} />
                        : <span style={{ color: c.text }} className="text-[11px] font-semibold uppercase tracking-wider">{col.label}</span>
                      }
                    </th>
                  ))}
                  {actions && (
                    <th scope="col" style={{ borderBottom: `2px solid ${c.primaryBorder}` }} className="px-4 py-3 text-right">
                      <span style={{ color: c.text }} className="text-[11px] font-semibold uppercase tracking-wider">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? <LoadingState c={c} /> : pageData.length === 0 ? <EmptyState message={emptyMessage} c={c} /> : (
                  pageData.map((item, i) => {
                    const absIdx = i + (safePage - 1) * itemsPerPage;
                    const isSel = selected.has(absIdx);
                    const isExp = expandedRows.has(absIdx);
                    return (
                      <React.Fragment key={absIdx}>
                        <tr
                          // onClick={() => { if (rowOnClick) onRowClick?.(item); }}
                          onClick={() => {
                            if (rowOnClick) {
                              onRowClick?.(item);

                              // ✅ A11Y
                              announce("Row opened");
                            }
                          }}
                          // ── a11y: clickable rows need keyboard support ──
                          role={rowOnClick ? "button" : undefined}
                          tabIndex={rowOnClick ? 0 : undefined}
                          onKeyDown={rowOnClick ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick?.(item);
                            }
                          } : undefined}
                          aria-selected={canShowCheckbox ? isSel : undefined}
                          style={{
                            background: isSel ? c.primaryLight : c.background,
                            borderTop: enableBorder ? `1px solid ${c.primaryBorder}` : "none",
                            cursor: rowOnClick ? "pointer" : "default",
                          }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--ipc-navy-50)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isSel ? c.primaryLight : c.background; }}
                          className="transition-colors hover:bg-[var(--ipc-navy-50)]"
                        >
                          {canShowCheckbox && (
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <Checkbox
                                checked={isSel}
                                accentColor={c.accent}
                                label={`Select row ${absIdx + 1}`}
                                onChange={e => handleSelectRow(absIdx, e.target.checked)}
                              />
                            </td>
                          )}
                          {nestedData && (
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              {/* ── a11y: expand button with state ── */}
                              <button
                                onClick={() => toggleRow(absIdx)}
                                aria-expanded={isExp}
                                aria-label={isExp ? "Collapse row details" : "Expand row details"}
                                style={{ border: `1px solid ${c.primaryBorder}`, background: c.primaryLight, color: c.textMuted }}
                                className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors"
                              >
                                {isExp
                                  ? <ChevronUp size={13} aria-hidden="true" />
                                  : <ChevronRight size={13} aria-hidden="true" />
                                }
                              </button>
                            </td>
                          )}
                          {columns.map((col: any) => {
                            const value = getValue(item, col.key);
                            return (
                              <td
                                key={col.key}
                                style={{ color: c.text }}
                                className={cn("px-4 py-3 text-sm", alignClass(col.align), numericCellClass(col, value))}
                              >
                                {col.render ? col.render(item) : value ?? "-"}
                              </td>
                            );
                          })}
                          {actions && (
                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                              {actions(item)}
                            </td>
                          )}
                        </tr>

                        {/* Nested row */}
                        {nestedData && isExp && (
                          <tr>
                            <td
                              colSpan={columns.length + (actions ? 1 : 0) + (canShowCheckbox ? 1 : 0) + 1}
                              style={{ background: c.primaryLight }}
                              className="pl-12"
                            >
                              <table className="w-full border-collapse text-xs" aria-label="Row details">
                                <thead>
                                  <tr>
                                    {nestedData.columns.map(col => (
                                      <th
                                        key={col.key}
                                        scope="col"
                                        style={{ borderBottom: `1px solid ${c.primaryBorder}`, color: c.textMuted }}
                                        className={cn("px-4 py-2 text-[10px] font-semibold uppercase tracking-wider", alignClass(col.align))}
                                      >
                                        {col.label}
                                      </th>
                                    ))}
                                    {nestedData.actions && (
                                      <th
                                        scope="col"
                                        style={{ borderBottom: `1px solid ${c.primaryBorder}`, color: c.textMuted }}
                                        className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider"
                                      >
                                        Actions
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(getValue(item, nestedData.key) ?? []).length === 0 ? (
                                    <tr>
                                      <td colSpan={999} style={{ color: c.textMuted }} className="px-4 py-3 text-xs">
                                        {nestedData.emptyMessage ?? "No data found"}
                                      </td>
                                    </tr>
                                  ) : (
                                    (getValue(item, nestedData.key) as any[]).map((nestedItem, ni) => (
                                      <tr key={ni} style={{ borderTop: `1px solid ${c.primaryBorder}` }}>
                                        {nestedData.columns.map(col => {
                                          const value = getValue(nestedItem, col.key);
                                          return (
                                            <td
                                              key={col.key}
                                              style={{ color: c.text }}
                                              className={cn("px-4 py-2 text-xs", alignClass(col.align), numericCellClass(col, value))}
                                            >
                                              {col.render ? col.render(nestedItem) : value ?? "-"}
                                            </td>
                                          );
                                        })}
                                        {nestedData.actions && (
                                          <td className="px-4 py-2 text-right">{nestedData.actions(nestedItem)}</td>
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

          {/* ── Pagination ── */}
          {totalRecords > itemsPerPage && (
            <div
              style={{ borderTop: `1px solid ${c.primaryBorder}`, background: c.primaryLight }}
              className="flex items-center justify-between px-5 py-3 gap-2 flex-wrap"
            >
              {/* ── a11y: live region so SR hears page change ── */}
              <span style={{ color: c.textMuted }} className="text-xs" aria-live="polite" aria-atomic="true">
                Showing{" "}
                <strong style={{ color: c.text }}>{(safePage - 1) * itemsPerPage + 1}</strong>–
                <strong style={{ color: c.text }}>{Math.min(safePage * itemsPerPage, totalRecords)}</strong>
                {" "}of{" "}
                <strong style={{ color: c.text }}>{totalRecords}</strong>
              </span>

              {/* ── a11y: nav landmark for pagination ── */}
              <nav aria-label="Table pagination">
                <div className="flex items-center gap-1">
                  {([
                    { icon: <ChevronsLeft size={14} />, fn: () => goToPage(1), label: "First page", off: safePage === 1 },
                    { icon: <ChevronLeft size={14} />, fn: () => goToPage(safePage - 1), label: "Previous page", off: safePage === 1 },
                    { icon: <ChevronRight size={14} />, fn: () => goToPage(safePage + 1), label: "Next page", off: safePage === totalPages },
                    { icon: <ChevronsRight size={14} />, fn: () => goToPage(totalPages), label: "Last page", off: safePage === totalPages },
                  ] as const).map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={btn.fn}
                      disabled={btn.off}
                      // ── a11y: every pagination button has a label ──
                      aria-label={btn.label}
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        border: `1px solid ${c.primaryBorder}`,
                        background: c.background,
                        cursor: btn.off ? "not-allowed" : "pointer",
                        opacity: btn.off ? 0.4 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: c.textMuted,
                      }}
                    >
                      <span aria-hidden="true">{btn.icon}</span>
                    </button>
                  ))}
                  <span style={{ color: c.textMuted }} className="text-xs ml-2">
                    Page <strong style={{ color: c.text }}>{safePage}</strong> / {totalPages}
                  </span>
                </div>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
