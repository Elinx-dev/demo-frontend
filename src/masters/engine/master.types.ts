// src/masters/engine/master.types.ts

import type { FieldValues, Path } from "react-hook-form";
import type { ReactNode } from "react";
import type { ApiConfig } from "@/ui/primitives/Table/Table";

// ─── Column config ────────────────────────────────────────────────────────────

export type MasterColumnConfig<T> = {
    key: any;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: "text" | "select" | "date" | "number";
    filterOptions?: { label: string; value: any }[];
    /**
     * When filterType is "select" and options come from an API,
     * set this instead of filterOptions.
     * MasterEngine will fetch and inject options automatically.
     */
    filterOptionsConfig?: {
        endpoint: string;   // e.g. "list_country"
        labelKey: string;   // e.g. "countryName"
        valueKey: string;   // e.g. "id"
        entityName: string; // e.g. "country"
    };
    width?: string | number;
    align?: "left" | "center" | "right";
    type?: "text" | "number" | "boolean" | "date";
    render?: (row: T) => ReactNode;
};

// ─── Dynamic select options config ───────────────────────────────────────────

export type FieldOptionsConfig = {
    endpoint: string;
    labelKey: string;
    valueKey: string;
    entityName: string;
};

// ─── Form field config ────────────────────────────────────────────────────────

export type MasterFormField<T extends FieldValues> = {
    name: any;
    label: string;
    type: "text" | "number" | "email" | "date" | "select" | "textarea" | "toggle";
    required?: boolean;
    placeholder?: string;
    defaultValue?: unknown;
    tooltip?: string;
    options?: { label: string; value: string | number }[];
    optionsConfig?: FieldOptionsConfig;
    validation?: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: RegExp;
        errorMessage?: string;
    };
};

// ─── Endpoint keys ────────────────────────────────────────────────────────────

export type MasterEndpointKeys = {
    list: string;
    create: string;
    update: string;
    delete?: string;
    getById?: string;
};

// ─── Entity meta ──────────────────────────────────────────────────────────────

export type MasterEntityConfig<T> = {
    name: string;
    idField: keyof T & string;
    statusField?: keyof T & string;
};

// ─── Top-level engine config ──────────────────────────────────────────────────

export type MasterEngineConfig<T extends FieldValues> = {
    id: string;
    title: string;
    description?: string;
    entity: MasterEntityConfig<T>;
    endpoints: MasterEndpointKeys;
    columns: MasterColumnConfig<T>[];
    form: {
        fields: MasterFormField<T>[];
    };
    audit?: boolean;
    /**
     * Base API path for server-side filtering e.g. "/country"
     * When set, MasterTable switches to server-side mode automatically.
     */
    apiUrl?: string;
    /**
     * Field(s) to search on when using the search input.
     * Can be a single field key or array of field keys.
     * If not specified, defaults to the first filterable column's key.
     */
    searchKey?: string | string[];
    /**
     * Optional full ApiConfig override.
     * If omitted but apiUrl is set, apiConfig is built automatically.
     */
    apiConfig?: ApiConfig;
    exportFlatten?: (row: T) => Record<string, any>;
};