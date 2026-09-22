// src/masters/components/MasterForm.tsx

import React, { useEffect, useState } from "react";
import {
    useForm,
    Controller,
    type FieldValues,
    type Path,
    type DefaultValues,
    type SubmitHandler,
    type UseFormReturn,
} from "react-hook-form";
import { useTheme } from "@/ui/theme/ThemeContext";
import { Button } from "@/ui/primitives/Button/Button";
import type { MasterFormField } from "../engine/master.types";
import { useSelectOptions } from "../engine/useSelectOptions";

// ─── Props ────────────────────────────────────────────────────────────────────

type MasterFormProps<T extends FieldValues> = {
    fields: MasterFormField<T>[];
    initialData?: Partial<T>;
    isReadOnly?: boolean;
    isEdit: boolean;
    onSave: SubmitHandler<T>;
    onClose: () => void;
};

// ─── FieldTooltip ─────────────────────────────────────────────────────────────

const FieldTooltip = ({ text, c }: { text: string; c: Record<string, string> }) => {
    const [show, setShow] = useState(false);

    return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span
                onMouseEnter={e => {
                    setShow(true);
                    (e.currentTarget as HTMLElement).style.borderColor = c.accent;
                    (e.currentTarget as HTMLElement).style.color = c.accent;
                }}
                onMouseLeave={e => {
                    setShow(false);
                    (e.currentTarget as HTMLElement).style.borderColor = c.primaryBorder;
                    (e.currentTarget as HTMLElement).style.color = c.textMuted;
                }}
                style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 15, height: 15, borderRadius: "50%",
                    border: `1.5px solid ${c.primaryBorder}`,
                    background: c.primaryLight, color: c.textMuted,
                    fontSize: 9, fontWeight: 700, cursor: "pointer",
                    userSelect: "none", transition: "border-color 0.15s, color 0.15s",
                    marginLeft: 5,
                }}
            >
                ?
            </span>

            {show && (
                <div style={{
                    position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)",
                    background: c.surface, border: `1px solid ${c.primaryBorder}`,
                    borderRadius: 8, padding: "7px 11px", zIndex: 100,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    whiteSpace: "nowrap", pointerEvents: "none",
                }}>
                    <span style={{
                        position: "absolute", left: -5, top: "50%", transform: "translateY(-50%)",
                        width: 8, height: 8, background: c.surface,
                        borderLeft: `1px solid ${c.primaryBorder}`,
                        borderBottom: `1px solid ${c.primaryBorder}`,
                        rotate: "45deg",
                    }} />
                    <span style={{ fontSize: 11, color: c.text, lineHeight: 1.5 }}>{text}</span>
                </div>
            )}
        </span>
    );
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({
    checked, onChange, accentColor, borderColor, disabled = false,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    accentColor: string;
    borderColor: string;
    disabled?: boolean;
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        style={{
            width: 44, height: 24, borderRadius: 12, border: "none",
            cursor: "pointer", padding: 2,
            background: checked ? accentColor : borderColor,
            transition: "background 0.2s", display: "flex",
            alignItems: "center", flexShrink: 0,
        }}
    >
        <span style={{
            width: 20, height: 20, borderRadius: "50%", background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s",
            transform: checked ? "translateX(20px)" : "translateX(0)", display: "block",
        }} />
    </button>
);

// ─── DynamicSelect ────────────────────────────────────────────────────────────
// Isolated component so useSelectOptions hook is only called for select fields
// that have optionsConfig - avoids calling hooks conditionally in InnerForm.

type DynamicSelectProps = {
    field: MasterFormField<FieldValues>;
    rhf: { value: unknown; onChange: (...e: unknown[]) => void; onBlur: () => void };
    hasError: boolean;
    inputStyle: React.CSSProperties;
    focusBorder: string;
    focusShadow: string;
    c: Record<string, string>;
    // FIX 1: added isReadOnly so the select is properly disabled in read-only mode
    isReadOnly?: boolean;
};

const DynamicSelect = ({
    field, rhf, hasError, inputStyle, focusBorder, focusShadow, c, isReadOnly,
}: DynamicSelectProps) => {
    const { options, loading } = useSelectOptions({
        endpoint: field.optionsConfig!.endpoint,
        labelKey: field.optionsConfig!.labelKey,
        valueKey: field.optionsConfig!.valueKey,
        entityName: field.optionsConfig!.entityName,
    });

    // FIX 2: Normalize the form value to a string so it matches the HTML <option value>
    // which is always a string. Without this, a numeric ID like 4 never matches "4"
    // and the select renders blank even though the data is correct.
    const stringValue =
        rhf.value !== undefined && rhf.value !== null && rhf.value !== ""
            ? String(rhf.value)
            : "";

    // FIX 3: Removed the broken useEffect that was calling rhf.onChange(rhf.value)
    // after options loaded. It had a stale closure (missing rhf.value in deps)
    // and calling onChange with the same value is a no-op anyway - the real fix
    // is stringifying the value above so the <select> controlled match works correctly.

    return (
        <select
            // FIX 2 applied here: always pass a string to <select value>
            value={stringValue}
            onChange={e => rhf.onChange(e.target.value === "" ? "" : Number(e.target.value))}
            // FIX 1 applied here: respect isReadOnly
            disabled={loading || isReadOnly}
            style={{
                ...inputStyle,
                ...(hasError ? { borderColor: c.danger } : {}),
                appearance: "none",
                cursor: loading || isReadOnly ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
            }}
            onFocus={e => {
                if (!isReadOnly) {
                    e.currentTarget.style.border = focusBorder;
                    e.currentTarget.style.boxShadow = focusShadow;
                }
            }}
            onBlur={e => {
                e.currentTarget.style.border = `1.5px solid ${hasError ? c.danger : c.primaryBorder}`;
                e.currentTarget.style.boxShadow = "none";
                rhf.onBlur();
            }}
        >
            <option value="" disabled>
                {loading ? "Loading…" : (field.placeholder ?? `Select ${field.label}`)}
            </option>
            {/* FIX 2 applied here: stringify opt.value so it matches stringValue above */}
            {options.map(opt => (
                <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

// ─── Validation rules ─────────────────────────────────────────────────────────

function buildRules(field: MasterFormField<FieldValues>): Record<string, unknown> {
    const rules: Record<string, unknown> = {};
    if (field.required) rules.required = `${field.label} is required`;
    if (field.validation?.minLength) {
        rules.minLength = { value: field.validation.minLength, message: field.validation.errorMessage ?? `Min ${field.validation.minLength} characters` };
    }
    if (field.validation?.maxLength) {
        rules.maxLength = { value: field.validation.maxLength, message: field.validation.errorMessage ?? `Max ${field.validation.maxLength} characters` };
    }
    if (field.validation?.min !== undefined)
        rules.min = { value: field.validation.min, message: `Min value is ${field.validation.min}` };
    if (field.validation?.max !== undefined)
        rules.max = { value: field.validation.max, message: `Max value is ${field.validation.max}` };
    if (field.validation?.pattern) {
        rules.pattern = { value: field.validation.pattern, message: field.validation.errorMessage ?? "Invalid format" };
    }
    return rules;
}

// ─── InnerForm ────────────────────────────────────────────────────────────────

type InnerFormProps<T extends FieldValues> = {
    form: UseFormReturn<T>;
    fields: MasterFormField<T>[];
    isEdit: boolean;
    onSave: SubmitHandler<T>;
    onClose: () => void;
    isReadOnly?: boolean;
};

function InnerForm<T extends FieldValues>({ form, fields, isEdit, onSave, onClose, isReadOnly }: InnerFormProps<T>) {
    const { theme } = useTheme();
    const c = theme.colors;

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "8px 12px", borderRadius: 8,
        border: `1.5px solid ${c.primaryBorder}`,
        background: isReadOnly ? c.primaryLight : c.surface,
        color: c.text,
        fontSize: 13,
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.15s, box-shadow 0.15s",
        cursor: isReadOnly ? "default" : "text",
    };
    const labelStyle: React.CSSProperties = {
        fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 5, display: "block",
    };
    const errorStyle: React.CSSProperties = { fontSize: 11, color: c.danger, marginTop: 3 };

    return (
        <form
            onSubmit={form.handleSubmit(onSave)}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
            {fields.map((field) => {
                const baseField = field as MasterFormField<FieldValues>;
                const fieldName = field.name as Path<T>;

                return (
                    <Controller
                        key={String(fieldName)}
                        name={fieldName}
                        control={form.control}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        defaultValue={baseField.defaultValue as any}
                        rules={buildRules(baseField)}
                        render={({ field: rhf, fieldState }) => {
                            const hasError = !!fieldState.error;
                            const focusBorder = `1.5px solid ${hasError ? c.danger : c.accent}`;
                            const focusShadow = `0 0 0 3px ${hasError ? c.danger : c.accent}22`;

                            // ── Toggle ────────────────────────────────────────
                            if (baseField.type === "toggle") {
                                return (
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <label style={labelStyle}>{baseField.label}
                                                {baseField.tooltip && <FieldTooltip text={baseField.tooltip} c={c as Record<string, string>} />}
                                            </label>
                                            <Toggle
                                                checked={!!rhf.value}
                                                onChange={isReadOnly ? () => { } : rhf.onChange}
                                                accentColor={c.accent}
                                                borderColor={c.primaryBorder}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        {hasError && <p style={errorStyle}>{fieldState.error?.message}</p>}
                                    </div>
                                );
                            }

                            // ── Select ────────────────────────────────────────
                            if (baseField.type === "select") {
                                return (
                                    <div>
                                        <label style={labelStyle}>
                                            {baseField.label}
                                            {baseField.required && <span style={{ color: c.danger }}> *</span>}
                                            {baseField.tooltip && <FieldTooltip text={baseField.tooltip} c={c as Record<string, string>} />}
                                        </label>

                                        {/* Dynamic options from API */}
                                        {baseField.optionsConfig ? (
                                            <DynamicSelect
                                                field={baseField}
                                                rhf={rhf}
                                                hasError={hasError}
                                                inputStyle={inputStyle}
                                                focusBorder={focusBorder}
                                                focusShadow={focusShadow}
                                                c={c as Record<string, string>}
                                                // FIX 1: pass isReadOnly down to DynamicSelect
                                                isReadOnly={isReadOnly}
                                            />
                                        ) : (
                                            /* Static options */
                                            <select
                                                {...rhf}
                                                value={rhf.value ?? ""}
                                                disabled={isReadOnly}
                                                style={{ ...inputStyle, ...(hasError ? { borderColor: c.danger } : {}), appearance: "none", cursor: "pointer" }}
                                                onFocus={e => { e.currentTarget.style.border = focusBorder; e.currentTarget.style.boxShadow = focusShadow; }}
                                                onBlur={e => { e.currentTarget.style.border = `1.5px solid ${hasError ? c.danger : c.primaryBorder}`; e.currentTarget.style.boxShadow = "none"; rhf.onBlur(); }}
                                            >
                                                <option value="" disabled>{baseField.placeholder ?? `Select ${baseField.label}`}</option>
                                                {(baseField.options ?? []).map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        )}

                                        {hasError && <p style={errorStyle}>{fieldState.error?.message}</p>}
                                    </div>
                                );
                            }

                            // ── Textarea ──────────────────────────────────────
                            if (baseField.type === "textarea") {
                                return (
                                    <div>
                                        <label style={labelStyle}>
                                            {baseField.label}
                                            {baseField.required && <span style={{ color: c.danger }}> *</span>}
                                            {baseField.tooltip && <FieldTooltip text={baseField.tooltip} c={c} />}
                                        </label>
                                        <textarea
                                            {...rhf}
                                            value={rhf.value ?? ""}
                                            placeholder={baseField.placeholder}
                                            disabled={isReadOnly}
                                            rows={3}
                                            style={{ ...inputStyle, resize: "vertical", ...(hasError ? { borderColor: c.danger } : {}) }}
                                            onFocus={e => { e.currentTarget.style.border = focusBorder; e.currentTarget.style.boxShadow = focusShadow; }}
                                            onBlur={e => { e.currentTarget.style.border = `1.5px solid ${hasError ? c.danger : c.primaryBorder}`; e.currentTarget.style.boxShadow = "none"; rhf.onBlur(); }}
                                        />
                                        {hasError && <p style={errorStyle}>{fieldState.error?.message}</p>}
                                    </div>
                                );
                            }

                            // ── Default: text / number / email / date ─────────
                            return (
                                <div>
                                    <label style={labelStyle}>
                                        {baseField.label}
                                        {baseField.required && <span style={{ color: c.danger }}> *</span>}
                                        {baseField.tooltip && <FieldTooltip text={baseField.tooltip} c={c} />}
                                    </label>
                                    <input
                                        {...rhf}
                                        value={rhf.value ?? ""}
                                        disabled={isReadOnly}
                                        type={baseField.type ?? "text"}
                                        placeholder={baseField.placeholder ?? `Enter ${baseField.label}`}
                                        style={{ ...inputStyle, ...(hasError ? { borderColor: c.danger } : {}) }}
                                        onFocus={e => { e.currentTarget.style.border = focusBorder; e.currentTarget.style.boxShadow = focusShadow; }}
                                        onBlur={e => { e.currentTarget.style.border = `1.5px solid ${hasError ? c.danger : c.primaryBorder}`; e.currentTarget.style.boxShadow = "none"; rhf.onBlur(); }}
                                    />
                                    {hasError && <p style={errorStyle}>{fieldState.error?.message}</p>}
                                </div>
                            );
                        }}
                    />
                );
            })}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: `1px solid ${c.primaryBorder}` }}>
                <Button type="button" variant="danger" size="md" onClick={onClose}>
                    {isReadOnly ? "Close" : "Cancel"}
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isReadOnly}
                    style={{
                        display: isReadOnly ? "none" : "inline-flex",
                    }}
                >
                    {isEdit ? "Update" : "Save"}
                </Button>
            </div>
        </form>
    );
}

// ─── MasterForm (public) ──────────────────────────────────────────────────────

export const MasterForm = <T extends FieldValues>({
    fields, initialData, isEdit, onSave, onClose, isReadOnly
}: MasterFormProps<T>) => {
    const form = useForm<T>({
        defaultValues: (initialData ?? {}) as DefaultValues<T>,
    });

  
    useEffect(() => {
        form.reset((initialData ?? {}) as DefaultValues<T>);
    }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <InnerForm<T>
            form={form}
            fields={fields}
            isEdit={isEdit}
            isReadOnly={isReadOnly}
            onSave={onSave}
            onClose={onClose}
        />
    );
};