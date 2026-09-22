import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { useMasterData } from "./useMasterData";
import type { MasterEngineConfig } from "./master.types";
import type { FieldValues } from "react-hook-form";
import type { Column } from "@/ui/primitives/Table/Table";
import { MasterHeader, STATIC_AUDIT } from "../components/MasterHeader";
import { MasterTable } from "../components/MasterTable";
import { MasterForm } from "../components/MasterForm";
import { ConfirmationModal } from "@/ui/primitives/ConformationModal/ConfirmationModal";
import { AuditModal } from "../components/AuditModal";
import { apiService } from "@/services/api";
import { authService } from "@/services/auth/authService";
import { Button } from "@/ui/primitives/Button/Button";
import { SquarePen, Trash2 } from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({
    active,
    c,
}: {
    active: boolean;
    c: Record<string, string>;
}) => (
    <span
        style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "2px 10px", borderRadius: 999,
            fontSize: 11, fontWeight: 600,
            background: active ? `${c.success}18` : `${c.danger}12`,
            color: active ? c.success : c.danger,
            border: `1px solid ${active ? c.success : c.danger}33`,
        }}
    >
        <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: active ? c.success : c.danger,
            display: "inline-block",
        }} />
        {active ? "Active" : "Inactive"}
    </span>
);

// ─── Helper: normalize API response → array ───────────────────────────────────

function normalizeToArray(raw: unknown, entityName: string): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        for (const key of ["data", "results", "items", "records", entityName, `${entityName}s`]) {
            if (Array.isArray(obj[key])) return obj[key] as any[];
        }
    }
    return [];
}

// ─── MasterEngine ─────────────────────────────────────────────────────────────

export const MasterEngine = <T extends FieldValues>({
    config,
}: {
    config: MasterEngineConfig<T>;
}) => {
    const { theme } = useTheme();
    const c = theme.colors;

    const [deleteItem, setDeleteItem] = useState<T | null>(null);
    const [auditItem, setAuditItem] = useState<T | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    // ── Dynamic filter options (keyed by column.key) ──────────────────────────
    // e.g. { countryId: [{ label: "India", value: 1 }, ...] }
    const [dynamicFilterOptions, setDynamicFilterOptions] = useState<
        Record<string, { label: string; value: any }[]>
    >({});

    // ── Fetch dynamic filter options once on mount ────────────────────────────
    useEffect(() => {
        const columnsWithDynamic = config.columns.filter(
            col => col.filterOptionsConfig
        );
        if (columnsWithDynamic.length === 0) return;

        const session = authService.getSession();
        if (session?.userId) apiService.setSessionUser(session.userId);

        columnsWithDynamic.forEach(async (col) => {
            const cfg = col.filterOptionsConfig!;
            try {
                const raw = await apiService.callEndpoint<unknown>(cfg.endpoint);
                const items = normalizeToArray(raw, cfg.entityName);
                const options = items.map(item => ({
                    label: String(item[cfg.labelKey] ?? ""),
                    value: item[cfg.valueKey],   // ← actual integer ID for FK columns
                }));
                setDynamicFilterOptions(prev => ({
                    ...prev,
                    [col.key]: options,
                }));
            } catch (err) {
                console.error(
                    `[MasterEngine] Failed to load filter options for column "${col.key}":`,
                    err
                );
            }
        });
        // Run once per master config (config.id is stable)
    }, [config.id]);
    // Update openForm to always open in read-only mode when editing
    const handleRowClick = (row: T) => {
        setIsReadOnly(true);       // ← read-only when clicking a row
        // master.openForm(row);
        setTimeout(() => master.openForm(row), 0);
    };

    const handleAdd = () => {
        setIsReadOnly(false);      // ← editable when clicking Add
        master.openForm();
    };
    // ── Master data hook ──────────────────────────────────────────────────────
    const master = useMasterData<T>({
        id: config.id,
        entity: config.entity,
        endpoints: config.endpoints,
    });

    // ── Single row delete ─────────────────────────────────────────────────────
    const confirmDelete = () => {
        if (deleteItem) {
            master.remove(deleteItem);
            setDeleteItem(null);
        }
    };

    // ── Bulk delete ───────────────────────────────────────────────────────────
    const handleBulkDelete = (rows: T[]) => {
        rows.forEach(row => master.remove(row));
    };

    // ── Build table columns ───────────────────────────────────────────────────
    // useMemo so columns only rebuild when config or dynamicFilterOptions change
    const tableColumns: Column<T>[] = useMemo(() => {
        return config.columns.map((col) => {
            const key = col.key as string;

            // Resolve filter options:
            // filterOptionsConfig (dynamic API) > filterOptions (static)
            const resolvedFilterOptions: { label: string; value: any }[] | undefined =
                col.filterOptionsConfig
                    ? (dynamicFilterOptions[col.key] ?? [])
                    : col.filterOptions;

            // ── Custom render ──────────────────────────────────────────────────
            if (col.render) {
                return {
                    key,
                    label: col.label,
                    sortable: col.sortable,
                    filterable: col.filterable ?? true,
                    filterType: col.filterType,
                    filterOptions: resolvedFilterOptions,
                    width: col.width,
                    align: col.align,
                    render: (row: T) => col.render!(row),
                } satisfies Column<T>;
            }

            // ── Boolean → StatusBadge ──────────────────────────────────────────
            if (col.type === "boolean") {
                return {
                    key,
                    label: col.label,
                    sortable: col.sortable,
                    filterable: col.filterable ?? true,
                    filterType: col.filterType,
                    filterOptions: resolvedFilterOptions,
                    width: col.width,
                    align: col.align ?? "center",
                    render: (row: T) => (
                        <StatusBadge active={!!row[col.key]} c={c as Record<string, string>} />
                    ),
                } satisfies Column<T>;
            }

            // ── Default text column ────────────────────────────────────────────
            return {
                key,
                label: col.label,
                sortable: col.sortable,
                filterable: col.filterable ?? true,
                filterType: col.filterType,
                filterOptions: resolvedFilterOptions,
                width: col.width,
                align: col.align,
            } satisfies Column<T>;
        });
    }, [config.columns, dynamicFilterOptions, c]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Header ── */}
            <MasterHeader
                title={config.title}
                onAdd={handleAdd}
                description={config.description}
            />

            {/* ── Table ── */}
            <MasterTable<T>
                columns={tableColumns}
                data={master.data}
                apiUrl={config.apiUrl}
                reloadKey={master.reloadKey}
                onEdit={(row) => master.openForm(row)}
                onDelete={(row) => setDeleteItem(row)}
                onAudit={(row) => setAuditItem(row)}
                // onRowClick={(row) => master.openForm(row)}
                onBulkDelete={handleBulkDelete}
                title={config.title}
                exportFlatten={config.exportFlatten}
                onRowClick={handleRowClick}
                searchKey={config.searchKey}
            />

            {/* ── Edit / Add Modal ── */}
            <Modal
                isOpen={master.open}
                onClose={() => { master.closeForm(); setIsReadOnly(false); }}
                title={
                    master.selected
                        ? `${config.title.replace(" Master", "")}`
                        : `Add ${config.title.replace(" Master", "")}`
                }
                size="md"
                // ── Header action icons (only when editing an existing row) ──
                headerActions={master.selected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Edit toggle */}
                        <Button
                            title={isReadOnly ? "Enable editing" : "Editing enabled"}
                            onClick={() => setIsReadOnly(prev => !prev)}
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center",
                                justifyContent: "center", transition: "background 0.15s",
                                background: isReadOnly ? c.primaryLight : `${c.accent}18`,
                                color: isReadOnly ? c.textMuted : c.accent,  // ← color on the button itself
                                padding: 0,  // ← remove internal padding that might push icon out of view
                            }}>
                            <SquarePen size={15} color={isReadOnly ? c.textMuted : c.accent} />  {/* ← explicit color + size */}
                        </Button>

                        {/* Delete */}
                        <Button
                            title="Delete record"
                            onClick={() => { master.closeForm(); setDeleteItem(master.selected); }}
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: "none",
                                cursor: "pointer", display: "flex", alignItems: "center",
                                justifyContent: "center", transition: "background 0.15s",
                                background: "#fef2f2",
                                padding: 0,  // ← remove internal padding
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}>
                            <Trash2 size={15} color={c.danger} />  {/* ← explicit color + size */}
                        </Button>
                    </div>
                ) : null}
            >
                <div style={{ padding: "24px" }}>
                    <MasterForm<T>
                        fields={config.form.fields}
                        initialData={master.selected ? (master.selected as Partial<T>) : undefined}
                        isEdit={!!master.selected}
                        isReadOnly={isReadOnly}          // ← pass down
                        onSave={master.save}
                        onClose={() => { master.closeForm(); setIsReadOnly(false); }}
                    />
                </div>
            </Modal>

            {/* ── Single-row delete confirmation ── */}
            <ConfirmationModal
                isOpen={!!deleteItem}
                title={`Delete ${config.title}`}
                message={`Are you sure you want to delete this ${config.entity.name}?`}
                onConfirm={confirmDelete}
                onClose={() => setDeleteItem(null)}
            />

            {/* ── Audit Modal ── */}
            <AuditModal
                isOpen={!!auditItem}
                onClose={() => setAuditItem(null)}
                title={config.title}
                records={STATIC_AUDIT}
            />
        </>
    );
};