import React, {
  useRef, useState, useCallback, useId,
  type CSSProperties, type DragEvent,
} from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "dashed" | "solid" | "ghost";

export interface UploadedFile {
  file: File;
  id: string;
  preview?: string;   // object URL for images
  error?: string;   // per-file rejection reason
}

export interface UploadZoneProps {
  /** Controlled file list */
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  /** Called with only valid files (no errors) */
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  /** Max number of files */
  maxFiles?: number;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  /** Show file previews below the zone */
  showPreview?: boolean;
  /** Show file size in preview */
  showSize?: boolean;
  size?: Size;
  variant?: Variant;
  /** Custom drag-over icon/content */
  icon?: React.ReactNode;
  /** Custom instruction text */
  description?: string;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<Size, {
  py: number; px: number; radius: number;
  iconSize: number; font: number; subFont: number;
  previewSize: number; gap: number;
}> = {
  sm: { py: 16, px: 16, radius: 8, iconSize: 28, font: 12, subFont: 11, previewSize: 52, gap: 6 },
  md: { py: 28, px: 24, radius: 10, iconSize: 40, font: 14, subFont: 12, previewSize: 68, gap: 8 },
  lg: { py: 40, px: 32, radius: 12, iconSize: 52, font: 15, subFont: 13, previewSize: 84, gap: 10 },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const UploadIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const FileIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const TrashIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const AlertIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const isImageFile = (file: File): boolean => file.type.startsWith("image/");

const buildUploadedFile = (file: File, maxSizeMB: number, accept?: string): UploadedFile => {
  const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
  let error: string | undefined;

  // Size check
  if (file.size / 1024 / 1024 > maxSizeMB) {
    error = `File exceeds ${maxSizeMB}MB limit`;
  }

  // Accept check
  if (!error && accept) {
    const acceptedTypes = accept.split(",").map(t => t.trim());
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1));
      if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type.toLowerCase());
      return file.type === type;
    });
    if (!isAccepted) error = `File type not accepted`;
  }

  // Preview for images
  const preview = !error && isImageFile(file) ? URL.createObjectURL(file) : undefined;

  return { file, id, preview, error };
};

// ─── UploadZone ───────────────────────────────────────────────────────────────

export const UploadZone = React.forwardRef<HTMLDivElement, UploadZoneProps>(
  (
    {
      value,
      onChange,
      onUpload,
      accept,
      multiple = true,
      maxSizeMB = 5,
      maxFiles,
      label,
      error,
      helperText,
      disabled = false,
      showPreview = true,
      showSize = true,
      size = "md",
      variant = "dashed",
      icon,
      description,
      className = "",
    },
    forwardedRef
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const zoneId = useId();

    // ── State ─────────────────────────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<UploadedFile[]>([]);
    const [dragging, setDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);

    const files = isControlled ? (value ?? []) : internal;

    const setFiles = useCallback((next: UploadedFile[]) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      onUpload?.(next.filter(f => !f.error).map(f => f.file));
    }, [isControlled, onChange, onUpload]);

    const inputRef = useRef<HTMLInputElement>(null);

    // ── Colors ────────────────────────────────────────────────────────────
    const accentColor = c.accent ?? "#6366f1";
    const dangerColor = c.danger ?? "#ef4444";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = c.text ?? "#111827";
    const mutedColor = c.textMuted ?? "#9ca3af";
    const surfaceBg = c.surface ?? "#ffffff";
    const surfaceAlt = c.primaryLight ?? "#f9fafb";

    const { py, px, radius, iconSize, font, subFont, previewSize, gap } = sizeMap[size];

    const hasError = !!error;
    const isMaxed = !!maxFiles && files.length >= maxFiles;
    const borderVal = hasError ? dangerColor : dragging ? accentColor : borderColor;

    // ── File handler ──────────────────────────────────────────────────────
    const handleFiles = useCallback((raw: FileList | null) => {
      if (!raw || disabled) return;
      setDragError(null);

      let incoming = Array.from(raw);

      // Max files cap
      if (maxFiles) {
        const remaining = maxFiles - files.length;
        if (remaining <= 0) { setDragError(`Maximum ${maxFiles} files allowed`); return; }
        incoming = incoming.slice(0, remaining);
      }

      // Only allow one if not multiple
      if (!multiple) incoming = incoming.slice(0, 1);

      const built = incoming.map(f => buildUploadedFile(f, maxSizeMB, accept));
      setFiles(multiple ? [...files, ...built] : built);

      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }, [disabled, maxFiles, files, multiple, maxSizeMB, accept, setFiles]);

    // ── Remove file ───────────────────────────────────────────────────────
    const handleRemove = useCallback((id: string) => {
      const target = files.find(f => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      setFiles(files.filter(f => f.id !== id));
    }, [files, setFiles]);

    // ── Drag handlers ─────────────────────────────────────────────────────
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); if (!disabled && !isMaxed) setDragging(true); };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (!disabled && !isMaxed) handleFiles(e.dataTransfer.files);
    };

    // ── Zone style (variant-driven) ───────────────────────────────────────
    const zoneStyle: CSSProperties = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: gap * 0.75,
      padding: `${py}px ${px}px`,
      borderRadius: radius,
      cursor: disabled || isMaxed ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      transition: "all 0.2s ease",
      textAlign: "center",
      width: "100%",
      boxSizing: "border-box",

      ...(variant === "dashed" && {
        border: `2px dashed ${borderVal}`,
        background: dragging ? `${accentColor}08` : hasError ? `${dangerColor}04` : surfaceBg,
        boxShadow: dragging ? `0 0 0 4px ${accentColor}14` : "none",
      }),
      ...(variant === "solid" && {
        border: `1.5px solid ${borderVal}`,
        background: dragging ? `${accentColor}08` : hasError ? `${dangerColor}04` : surfaceAlt,
        boxShadow: dragging ? `0 0 0 4px ${accentColor}14` : "none",
      }),
      ...(variant === "ghost" && {
        border: "none",
        background: dragging ? `${accentColor}10` : surfaceAlt,
      }),
    } as CSSProperties;

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        ref={forwardedRef}
        className={className}
        style={{ width: "100%", display: "flex", flexDirection: "column", gap: gap }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={zoneId}
            style={{
              fontSize: font,
              fontWeight: 500,
              color: textColor,
              userSelect: "none",
              cursor: "default",
            }}
          >
            {label}
            {maxFiles && (
              <span style={{ fontSize: font - 2, color: mutedColor, marginLeft: 6, fontWeight: 400 }}>
                ({files.length}/{maxFiles})
              </span>
            )}
          </label>
        )}

        {/* Drop zone */}
        <div
          style={zoneStyle}
          onClick={() => !disabled && !isMaxed && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          aria-label="Upload files"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        >
          {/* Icon */}
          <div style={{
            color: dragging ? accentColor : hasError ? dangerColor : mutedColor,
            transition: "color 0.2s",
          }}>
            {icon ?? <UploadIcon size={iconSize} color="currentColor" />}
          </div>

          {/* Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{ fontSize: font, fontWeight: 500, color: dragging ? accentColor : textColor, margin: 0, transition: "color 0.2s" }}>
              {dragging
                ? "Release to drop files"
                : description ?? "Drag & drop files here or click to browse"
              }
            </p>
            <p style={{ fontSize: subFont, color: mutedColor, margin: 0 }}>
              {[
                accept && `Accepted: ${accept}`,
                `Max size: ${maxSizeMB}MB`,
                maxFiles && `Up to ${maxFiles} file${maxFiles > 1 ? "s" : ""}`,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            id={zoneId}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
            aria-hidden="true"
          />
        </div>

        {/* Drag error */}
        {dragError && (
          <p style={{ fontSize: subFont, color: dangerColor, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <AlertIcon size={subFont + 2} color={dangerColor} /> {dragError}
          </p>
        )}

        {/* Group error */}
        {hasError && (
          <p role="alert" style={{ fontSize: subFont, color: dangerColor, margin: 0 }}>
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p style={{ fontSize: subFont, color: mutedColor, margin: 0 }}>
            {helperText}
          </p>
        )}

        {/* File preview list */}
        {showPreview && files.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: gap * 0.75 }}>
            {files.map((uf) => (
              <div
                key={uf.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: gap,
                  padding: `${gap * 0.75}px ${gap}px`,
                  borderRadius: radius * 0.7,
                  border: `1.5px solid ${uf.error ? dangerColor : borderColor}`,
                  background: uf.error ? `${dangerColor}06` : surfaceBg,
                  transition: "all 0.15s",
                }}
              >
                {/* Thumbnail or file icon */}
                <div style={{
                  width: previewSize,
                  height: previewSize,
                  flexShrink: 0,
                  borderRadius: radius * 0.5,
                  overflow: "hidden",
                  background: surfaceAlt,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${borderColor}`,
                }}>
                  {uf.preview ? (
                    <img
                      src={uf.preview}
                      alt={uf.file.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <FileIcon size={previewSize * 0.45} color={uf.error ? dangerColor : mutedColor} />
                  )}
                </div>

                {/* File info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{
                    fontSize: font - 1,
                    fontWeight: 500,
                    color: uf.error ? dangerColor : textColor,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {uf.file.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {showSize && (
                      <span style={{ fontSize: subFont, color: mutedColor }}>
                        {formatBytes(uf.file.size)}
                      </span>
                    )}
                    {uf.error && (
                      <span style={{
                        fontSize: subFont,
                        color: dangerColor,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        fontWeight: 500,
                      }}>
                        <AlertIcon size={subFont + 1} color={dangerColor} />
                        {uf.error}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(uf.id)}
                    aria-label={`Remove ${uf.file.name}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: mutedColor,
                      padding: 4,
                      borderRadius: 4,
                      transition: "color 0.12s, background 0.12s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = dangerColor;
                      (e.currentTarget as HTMLElement).style.background = `${dangerColor}10`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = mutedColor;
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <TrashIcon size={font + 2} color="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

UploadZone.displayName = "UploadZone";

// Example usage:
// Basic
{/* <UploadZone onUpload={(files) => console.log(files)} /> */ }

// Image only with preview
{/* <UploadZone
    label="Product Images"
    accept="image/*"
    multiple maxFiles={5} maxSizeMB={3}
    showPreview showSize
    onUpload={(files) => setImages(files)}
    helperText="PNG, JPG up to 3MB each"
/> */}

// Single file - PDF only
{/* <UploadZone
    label="Upload Resume"
    accept=".pdf"
    multiple={false}
    onUpload={([file]) => setResume(file)}
    variant="solid" size="sm"
/> */}

// Controlled (with RHF Controller)
{/* <Controller
    name="images" control={control}
    render={({ field }) => (
        <UploadZone
            label="Gallery"
            accept="image/*" multiple maxFiles={8}
            value={field.value}
            onChange={field.onChange}
            error={errors.images?.message}
        />
    )}
/> */}

// Sizes & Variants
{/* <UploadZone size="sm" variant="ghost"  onUpload={f => console.log(f)} /> */ }
{/* <UploadZone size="lg" variant="solid"  onUpload={f => console.log(f)} /> */ }

// Error state
{/* <UploadZone error="Please upload at least one file" onUpload={f => console.log(f)} /> */ }