// src/masters/engine/useMasterData.ts

import { useState, useCallback } from "react";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import type { MasterEntityConfig, MasterEndpointKeys } from "./master.types";
import { apiService } from "@/services/api";
import { authService } from "@/services/auth/authService";

// ─── Types ────────────────────────────────────────────────────────────────────

type UseMasterDataOptions<T> = {
    id: string;
    entity: MasterEntityConfig<T>;
    endpoints: MasterEndpointKeys;
};

type UseMasterDataReturn<T> = {
    data: T[];
    loading: boolean;
    error: string | null;
    open: boolean;
    selected: T | null;
    openForm: (row?: T) => void;
    closeForm: () => void;
    save: SubmitHandler<T>;
    remove: (row: T) => Promise<void>;
    reload: () => Promise<void>;
    /** Current reload key - pass to MasterTable so it refetches after save/delete */
    reloadKey: number;
    /** Call this to increment reloadKey and trigger a Table refetch */
    triggerReload: () => void;
};

// ─── Normalize any API shape → T[] ───────────────────────────────────────────

function normalizeToArray<T>(raw: unknown, entityName: string): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        for (const key of ["data", "results", "items", "records", entityName, `${entityName}s`]) {
            if (Array.isArray(obj[key])) return obj[key] as T[];
        }
        for (const key of Object.keys(obj)) {
            if (Array.isArray(obj[key])) return obj[key] as T[];
        }
    }
    console.warn("[useMasterData] Could not find array in response:", raw);
    return [];
}

// ─── Helper: inject record id into a registered path ─────────────────────────

function buildUrlWithId(registeredPath: string, id: string | number): string {
    if (registeredPath.includes(":id")) {
        return registeredPath.replace(/:id/g, String(id));
    }
    return `${registeredPath.replace(/\/$/, "")}/${id}`;
}

// ─── Ensure sessionUserId is set before any request ──────────────────────────

function ensureSession() {
    const session = authService.getSession();
    if (session?.userId) {
        apiService.setSessionUser(session.userId);
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMasterData<T extends FieldValues>({
    id,
    entity,
    endpoints,
}: UseMasterDataOptions<T>): UseMasterDataReturn<T> {

    const [data]                    = useState<T[]>([]);
    const [loading, setLoading]     = useState(false);
    const [error,   setError]       = useState<string | null>(null);
    const [open,    setOpen]        = useState(false);
    const [selected, setSelected]   = useState<T | null>(null);

    // ── reloadKey - increment to force MasterTable/Table to refetch ───────────
    const [reloadKey, setReloadKey] = useState(0);
    const triggerReload = useCallback(() => setReloadKey(k => k + 1), []);

    // ── fetchAll - legacy fallback (used when apiUrl is NOT set on config) ─────
    const fetchAll = useCallback(async () => {
        ensureSession();
        setLoading(true);
        setError(null);
        try {
            const raw = await apiService.callEndpoint<unknown>(endpoints.list);
            normalizeToArray<T>(raw, entity.name); // result unused in apiUrl mode
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load data";
            setError(msg);
            console.error(`[MasterData:${id}] list error`, err);
        } finally {
            setLoading(false);
        }
    }, [id, entity.name, endpoints.list]);

    // ── Open / close ──────────────────────────────────────────────────────────

    const openForm  = useCallback((row?: T) => { setSelected(row ?? null); setOpen(true);  }, []);
    const closeForm = useCallback(()         => { setSelected(null);        setOpen(false); }, []);

    // ── Save ──────────────────────────────────────────────────────────────────

    const save: SubmitHandler<T> = useCallback(
        async (formData) => {
            ensureSession();
            try {
                if (selected) {
                    const recordId = selected[entity.idField] as string | number;
                    const basePath = apiService.getEndpointPath(endpoints.update);
                    await apiService.callEndpoint<unknown>(endpoints.update, {
                        data: formData,
                        url: buildUrlWithId(basePath, recordId),
                    });
                } else {
                    await apiService.callEndpoint<unknown>(endpoints.create, { data: formData });
                }
                // ✅ Trigger Table refetch instead of local fetchAll
                triggerReload();
                closeForm();
            } catch (err) {
                console.error(`[MasterData:${id}] save error`, err);
                throw err;
            }
        },
        [selected, entity, endpoints, id, triggerReload, closeForm]
    );

    // ── Remove ────────────────────────────────────────────────────────────────

    const remove = useCallback(
        async (row: T) => {
            ensureSession();
            const recordId = row[entity.idField] as string | number;
            try {
                if (entity.statusField) {
                    const basePath = apiService.getEndpointPath(endpoints.update);
                    await apiService.callEndpoint<unknown>(endpoints.update, {
                        data: { ...row, [entity.statusField]: false },
                        url: buildUrlWithId(basePath, recordId),
                    });
                } else if (endpoints.delete) {
                    const basePath = apiService.getEndpointPath(endpoints.delete);
                    await apiService.callEndpoint<unknown>(endpoints.delete, {
                        url: buildUrlWithId(basePath, recordId),
                    });
                }
                // ✅ Trigger Table refetch
                triggerReload();
            } catch (err) {
                console.error(`[MasterData:${id}] remove error`, err);
                throw err;
            }
        },
        [entity, endpoints, id, triggerReload]
    );

    return {
        data,
        loading,
        error,
        open,
        selected,
        openForm,
        closeForm,
        save,
        remove,
        reload: fetchAll,
        reloadKey,
        triggerReload,
    };
}