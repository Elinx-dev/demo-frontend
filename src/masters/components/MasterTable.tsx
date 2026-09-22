// src/masters/components/MasterTable.tsx

import { useMemo, useState } from "react";
import type { Column, ApiConfig } from "@/ui/primitives/Table/Table";
import Table from "@/ui/primitives/Table/Table";
import { apiConfig as appApiConfig } from "@/services/api/api.config";
import { ExportDropdown } from "@/utils/exportUtils";
import { useTheme } from "@/ui/theme/ThemeContext";

type MasterTableProps<T> = {
    columns: Column<T>[];
    data?: T[];
    onEdit: (row: T) => void;
    onDelete: (row: T) => void;
    onAudit: (row: T) => void;
    onRowClick?: (row: T) => void;
    onBulkDelete?: (rows: T[]) => void;
    apiUrl?: string;
    reloadKey?: number;
    exportFlatten?: (row: T) => Record<string, any>;
    exportFilenamePrefix?: string;
    title?: string;
    searchKey?: string | string[];
};

function buildAutoFlatten<T>(columns: Column<T>[]) {
    return (row: T): Record<string, any> => {
        const result: Record<string, any> = {};
        columns.forEach(col => {
            const raw = (row as any)[col.key];
            if (typeof raw === "boolean") {
                result[col.label] = raw ? "Active" : "Inactive";
            } else if (raw && typeof raw === "object") {
                result[col.label] = (raw as any).name ?? (raw as any).label ?? JSON.stringify(raw);
            } else {
                result[col.label] = raw ?? "";
            }
        });
        return result;
    };
}

export const MasterTable = <T extends Record<string, any>>({
    columns,
    data,
    onEdit,
    onRowClick,
    onBulkDelete,
    apiUrl,
    reloadKey = 0,
    exportFlatten,
    exportFilenamePrefix,
    title,
    searchKey,
}: MasterTableProps<T>) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const safeData: T[] = Array.isArray(data) ? data : [];

    const [visibleRows, setVisibleRows] = useState<T[]>([]);
    const [selectedRows, setSelectedRows] = useState<T[]>([]);

    const flatten = useMemo(
        () => exportFlatten ?? buildAutoFlatten(columns),
        [exportFlatten, columns]
    );

    const filenamePrefix = exportFilenamePrefix
        ?? (title ? title.toLowerCase().replace(/\s+/g, "-") : "export");

    const baseApiConfig = useMemo<ApiConfig | undefined>(() => {
        if (!apiUrl) return undefined;
        return {
            url: `${appApiConfig.baseUrl}${apiUrl}`,
            method: "GET" as const,
            mapParams: ({ page, itemsPerPage, sortKey, sortDir, search, filters }) => ({
                page, pageSize: itemsPerPage,
                ...(sortKey && { sortBy: sortKey }),
                ...(sortDir && { sortDir }),
                ...(search.trim() && searchKey && typeof searchKey === "string" && { [searchKey]: search.trim() }),
                ...(search.trim() && !searchKey && { search: search.trim() }),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([, v]) => v !== "" && v != null)
                ),
            }),
            mapResponse: (res) => ({
                data: res?.data ?? [],
                total: res?.pagination?.total ?? res?.data?.length ?? 0,
            }),
        };
    }, [apiUrl, searchKey]);

    const tableApiConfig = useMemo<ApiConfig | undefined>(() => {
        if (!baseApiConfig) return undefined;
        return { ...baseApiConfig, headers: { "x-reload-key": String(reloadKey) } };
    }, [baseApiConfig, reloadKey]);

    // ── Export buttons - injected into Table's toolbar slot ───────────────────
    const exportButtons = (
        <>
            {selectedRows.length > 0 && (
                <ExportDropdown
                    data={selectedRows}
                    flatten={flatten}
                    label={`Export Selected (${selectedRows.length})`}
                    filenamePrefix={`${filenamePrefix}-selected`}
                    c={c}
                />
            )}
            <ExportDropdown
                data={visibleRows}
                flatten={flatten}
                label="Export"
                filenamePrefix={filenamePrefix}
                c={c}
            />
        </>
    );

    return (
        <Table<T>
            columns={columns}
            {...(tableApiConfig ? { apiConfig: tableApiConfig } : { data: safeData })}
            itemsPerPage={10}
            enableGridView={true}
            enableTableView={true}
            enableInputFilter={true}
            enableDataLength={true}
            enableBorder={true}
            rowOnClick={true}
            onRowClick={onRowClick ?? onEdit}
            showCheckbox={true}
            onBulkDelete={onBulkDelete}
            onDataFetched={(rows) => setVisibleRows(rows)}
            onVisibleRowsChange={(rows) => setVisibleRows(rows)}
            onSelectionChange={(rows) => setSelectedRows(rows)}
            toolbarActions={exportButtons}  // ✅ renders inline, left of view toggle
            debounceMs={500}
        />
    );
};