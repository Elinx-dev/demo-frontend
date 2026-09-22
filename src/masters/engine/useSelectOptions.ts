// src/masters/engine/useSelectOptions.ts

import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { authService } from "@/services/auth/authService";

export type SelectOption = {
    label: string;
    value: string | number;
};

type UseSelectOptionsConfig = {
    /** endpoint key from api.config.ts e.g. "list_country" */
    endpoint: string;
    /** field to use as the option label e.g. "countryName" */
    labelKey: string;
    /** field to use as the option value e.g. "id" */
    valueKey: string;
    /** entity name for normalizeToArray e.g. "country" */
    entityName: string;
};

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
    return [];
}

export function useSelectOptions({
    endpoint,
    labelKey,
    valueKey,
    entityName,
}: UseSelectOptionsConfig): { options: SelectOption[]; loading: boolean } {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetch = async () => {
            // ensure session before request
            const session = authService.getSession();
            if (session?.userId) apiService.setSessionUser(session.userId);

            setLoading(true);
            try {
                const raw = await apiService.callEndpoint<unknown>(endpoint);
                const arr = normalizeToArray<Record<string, unknown>>(raw, entityName);
                if (!cancelled) {
                    setOptions(
                        arr.map((item) => ({
                            label: String(item[labelKey] ?? ""),
                            value: item[valueKey] as string | number,
                        }))
                    );
                }
            } catch (err) {
                console.error(`[useSelectOptions] fetch error for "${endpoint}"`, err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetch();
        return () => { cancelled = true; };
    }, [endpoint, labelKey, valueKey, entityName]);

    return { options, loading };
}