import React, {
  useRef,
  useState,
  useId,
  useCallback,
  type CSSProperties,
} from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "underline" | "ghost";
type Status = "default" | "error" | "success" | "warning";
type DisplayFile = File & { displaySize?: number };

export interface FileInputProps {
  /** Controlled file(s) */
  value?: File | File[] | null;
  /** Default value (uncontrolled) */
  defaultValue?: File | File[] | null;
  onChange?: (file: File | File[] | null) => void;
  /** native accept e.g "image/*,.pdf" */
  accept?: string;
  multiple?: boolean;
  /** Max file size in MB per file */
  maxSizeMB?: number;
  /** Max number of files (multiple mode) */
  maxFiles?: number;
  label?: string;
  /** Placeholder text when no file selected */
  placeholder?: string;
  /** Button label */
  buttonText?: string;
  error?: string;
  helperText?: string;
  status?: Status;
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
  readOnly?: boolean;
  /** Show clear button when a file is selected */
  allowClear?: boolean;
  /** Show image thumbnail preview inline */
  showPreview?: boolean;
  /** RHF register - passed explicitly */
  register?: (name: string) => React.InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
  name?: string;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<
  Size,
  {
    h: number;
    font: number;
    px: number;
    py: number;
    radius: number;
    btnFont: number;
    btnPx: number;
    iconSize: number;
    thumbSize: number;
  }
> = {
  sm: {
    h: 32,
    font: 12,
    px: 10,
    py: 5,
    radius: 6,
    btnFont: 11,
    btnPx: 10,
    iconSize: 14,
    thumbSize: 24,
  },
  md: {
    h: 40,
    font: 14,
    px: 14,
    py: 9,
    radius: 8,
    btnFont: 13,
    btnPx: 14,
    iconSize: 16,
    thumbSize: 30,
  },
  lg: {
    h: 48,
    font: 15,
    px: 16,
    py: 12,
    radius: 10,
    btnFont: 14,
    btnPx: 18,
    iconSize: 18,
    thumbSize: 36,
  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const PaperclipIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const XIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ImageIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const FileDocIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

const ErrorIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SuccessIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getDisplayFileSize = (file: File) =>
  (file as DisplayFile).displaySize ?? file.size;

const isImage = (file: File) => file.type.startsWith("image/");

const getFileIcon = (file: File, size: number, color: string) =>
  isImage(file) ? (
    <ImageIcon size={size} color={color} />
  ) : (
    <FileDocIcon size={size} color={color} />
  );

// ─── FileInput ────────────────────────────────────────────────────────────────

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      value,
      defaultValue = null,
      onChange,
      accept,
      multiple = false,
      maxSizeMB,
      maxFiles,
      label,
      placeholder = "No file chosen",
      buttonText = "Browse",
      error,
      helperText,
      status = "default",
      size = "md",
      variant = "outline",
      disabled = false,
      readOnly = false,
      allowClear = true,
      showPreview = true,
      register,
      name,
      className = "",
    },
    forwardedRef,
  ) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const autoId = useId();
    const id = name ?? autoId;

    const [focused, setFocused] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    // ── Controlled / uncontrolled ─────────────────────────────────────────
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<File | File[] | null>(
      defaultValue,
    );
    const files = isControlled ? value : internal;

    // Normalise to array for display
    const fileList: File[] = files
      ? Array.isArray(files)
        ? files
        : [files]
      : [];

    const setFiles = useCallback(
      (next: File | File[] | null) => {
        if (!isControlled) setInternal(next);
        onChange?.(next);
      },
      [isControlled, onChange],
    );

    // ── RHF ref merge ─────────────────────────────────────────────────────
    const rhfProps = register && name ? register(name) : {};
    const {
      ref: rhfRef,
      onChange: rhfOnChange,
      ...rhfRest
    } = rhfProps as {
      ref?: React.Ref<HTMLInputElement>;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
      [k: string]: unknown;
    };

    const nativeInputRef = useRef<HTMLInputElement>(null);

    const mergedRef = (node: HTMLInputElement | null) => {
      (
        nativeInputRef as React.MutableRefObject<HTMLInputElement | null>
      ).current = node;
      if (typeof rhfRef === "function") rhfRef(node);
      else if (rhfRef)
        (rhfRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (
          forwardedRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = node;
    };

    // ── File validation + selection ───────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || readOnly) return;
      setFileError(null);

      let incoming = Array.from(e.target.files);

      // Max files
      if (maxFiles && incoming.length > maxFiles) {
        setFileError(`Max ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`);
        incoming = incoming.slice(0, maxFiles);
      }

      // Size validation
      if (maxSizeMB) {
        const oversized = incoming.filter(
          (f) => f.size / 1024 / 1024 > maxSizeMB,
        );
        if (oversized.length) {
          setFileError(
            `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length > 1 ? "" : "s"} ${maxSizeMB}MB`,
          );
          incoming = incoming.filter((f) => f.size / 1024 / 1024 <= maxSizeMB);
        }
      }

      if (!incoming.length) {
        setFiles(null);
        return;
      }

      const fileTarget = multiple ? incoming : incoming[0];
      setFiles(fileTarget);
      rhfOnChange?.(e);

      // Reset so same file triggers onChange again
      e.target.value = "";
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFiles(null);
      setFileError(null);
      if (nativeInputRef.current) nativeInputRef.current.value = "";
    };

    // ── Colors ────────────────────────────────────────────────────────────
    const accentColor = c.accent ?? "#6366f1";
    const dangerColor = c.danger ?? "#ef4444";
    const successColor = c.success ?? "#22c55e";
    const warningColor = "#f59e0b";
    const borderColor = c.primaryBorder ?? "#d1d5db";
    const textColor = c.text ?? "#111827";
    const mutedColor = c.textMuted ?? "#9ca3af";
    const surfaceBg = c.surface ?? "#ffffff";
    const surfaceAlt = c.primaryLight ?? "#f9fafb";

    const effectiveStatus: Status = error || fileError ? "error" : status;

    const statusColorMap: Record<Status, string> = {
      default: accentColor,
      error: dangerColor,
      success: successColor,
      warning: warningColor,
    };
    const statusBorderMap: Record<Status, string> = {
      default: borderColor,
      error: dangerColor,
      success: successColor,
      warning: warningColor,
    };

    const focusColor = statusColorMap[effectiveStatus];
    const borderVal = focused ? focusColor : statusBorderMap[effectiveStatus];
    const hasError = !!(error || fileError);
    const hasFiles = fileList.length > 0;

    const { h, font, px, py, radius, btnFont, btnPx, iconSize, thumbSize } =
      sizeMap[size];

    // ── Wrapper style (variant-driven) ────────────────────────────────────
    const wrapperStyle: CSSProperties = (() => {
      const base: CSSProperties = {
        display: "flex",
        alignItems: "center",
        width: "100%",
        minHeight: h,
        borderRadius: radius,
        overflow: "hidden",
        transition: "box-shadow 0.15s, border-color 0.15s",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "default",
        boxSizing: "border-box" as const,
      };
      switch (variant) {
        case "filled":
          return {
            ...base,
            background: focused ? surfaceBg : surfaceAlt,
            border: `1.5px solid ${focused ? focusColor : "transparent"}`,
            boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none",
          };
        case "underline":
          return {
            ...base,
            borderRadius: 0,
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${borderVal}`,
            boxShadow: "none",
          };
        case "ghost":
          return {
            ...base,
            background: focused ? surfaceAlt : "transparent",
            border: "none",
          };
        default: // outline
          return {
            ...base,
            background: surfaceBg,
            border: `1.5px solid ${borderVal}`,
            boxShadow: focused ? `0 0 0 3px ${focusColor}22` : "none",
          };
      }
    })();

    // ── Display text ──────────────────────────────────────────────────────
    const displayText = hasFiles
      ? fileList.length === 1
        ? fileList[0].name
        : `${fileList.length} files selected`
      : placeholder;

    // ─────────────────────────────────────────────────────────────────────
    return (
      <div
        className={className}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            style={{
              fontSize: font - 1,
              fontWeight: 500,
              color: focused ? focusColor : textColor,
              userSelect: "none",
              cursor: "default",
              transition: "color 0.15s",
            }}
          >
            {label}
          </label>
        )}

        {/* Input row */}
        <div style={wrapperStyle}>
          {/* Browse button */}
          <button
            type="button"
            disabled={disabled || readOnly}
            onClick={() => nativeInputRef.current?.click()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Browse files"
            style={{
              flexShrink: 0,
              height: "100%",
              minHeight: h,
              padding: `0 ${btnPx}px`,
              border: "none",
              borderRight:
                variant === "outline" || variant === "filled"
                  ? `1.5px solid ${borderVal}`
                  : "none",
              background: hasFiles ? accentColor : `${accentColor}15`,
              color: hasFiles ? "#fff" : accentColor,
              fontSize: btnFont,
              fontWeight: 600,
              cursor: disabled || readOnly ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "background 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!disabled && !readOnly) {
                (e.currentTarget as HTMLElement).style.background = accentColor;
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !readOnly) {
                (e.currentTarget as HTMLElement).style.background = hasFiles
                  ? accentColor
                  : `${accentColor}15`;
                (e.currentTarget as HTMLElement).style.color = hasFiles
                  ? "#fff"
                  : accentColor;
              }
            }}
          >
            <PaperclipIcon size={iconSize - 2} color="currentColor" />
            {buttonText}
          </button>

          {/* File name display */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: `${py}px ${px}px`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Inline thumbnail (single image) */}
            {showPreview && hasFiles && fileList.length === 1 && (
              <InlineThumbnail
                file={fileList[0]}
                size={thumbSize}
                radius={radius * 0.5}
                accentColor={accentColor}
                mutedColor={mutedColor}
                borderColor={borderColor}
                surfaceAlt={surfaceAlt}
              />
            )}

            {/* Text */}
            <span
              style={{
                flex: 1,
                fontSize: font,
                color: hasFiles ? textColor : mutedColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayText}
            </span>

            {/* File size */}
            {hasFiles && fileList.length === 1 && (
              <span
                style={{
                  fontSize: font - 2,
                  color: mutedColor,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {formatBytes(getDisplayFileSize(fileList[0]))}
              </span>
            )}
          </div>

          {/* Status icon */}
          {effectiveStatus !== "default" && !hasFiles && (
            <span
              style={{
                paddingRight: px * 0.6,
                flexShrink: 0,
                display: "inline-flex",
              }}
            >
              {effectiveStatus === "error" ? (
                <ErrorIcon size={iconSize} color={dangerColor} />
              ) : (
                <SuccessIcon size={iconSize} color={successColor} />
              )}
            </span>
          )}

          {/* Clear button */}
          {allowClear && hasFiles && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear file"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginRight: px * 0.5,
                width: h * 0.55,
                height: h * 0.55,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: mutedColor,
                transition: "color 0.12s, background 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = dangerColor;
                (e.currentTarget as HTMLElement).style.background =
                  `${dangerColor}12`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = mutedColor;
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <XIcon size={iconSize - 2} color="currentColor" />
            </button>
          )}
        </div>

        {/* Multiple file list */}
        {showPreview && hasFiles && fileList.length > 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {fileList.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: `${py * 0.6}px ${px * 0.8}px`,
                  borderRadius: radius * 0.7,
                  border: `1px solid ${borderColor}`,
                  background: surfaceBg,
                }}
              >
                <InlineThumbnail
                  file={file}
                  size={thumbSize}
                  radius={radius * 0.4}
                  accentColor={accentColor}
                  mutedColor={mutedColor}
                  borderColor={borderColor}
                  surfaceAlt={surfaceAlt}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: font - 1,
                    color: textColor,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </span>
                <span
                  style={{
                    fontSize: font - 2,
                    color: mutedColor,
                    flexShrink: 0,
                  }}
                >
                  {formatBytes(getDisplayFileSize(file))}
                </span>
                {!disabled && !readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = fileList.filter((_, i) => i !== idx);
                      setFiles(
                        next.length ? (multiple ? next : next[0]) : null,
                      );
                    }}
                    style={{
                      display: "inline-flex",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: mutedColor,
                      padding: 2,
                      borderRadius: 4,
                      transition: "color 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        dangerColor)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        mutedColor)
                    }
                    aria-label={`Remove ${file.name}`}
                  >
                    <XIcon size={font} color="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* File error */}
        {fileError && (
          <p
            style={{
              fontSize: font - 2,
              color: dangerColor,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {fileError}
          </p>
        )}

        {/* Prop error */}
        {error && !fileError && (
          <p
            role="alert"
            style={{
              fontSize: font - 2,
              color: dangerColor,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {error}
          </p>
        )}

        {/* Helper */}
        {!hasError && helperText && (
          <p
            style={{
              fontSize: font - 2,
              color: mutedColor,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {helperText}
          </p>
        )}

        {/* Hidden native input */}
        <input
          ref={mergedRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          style={{ display: "none" }}
          aria-hidden="true"
          {...(rhfRest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      </div>
    );
  },
);

FileInput.displayName = "FileInput";

// ─── Inline thumbnail helper ──────────────────────────────────────────────────

interface InlineThumbnailProps {
  file: File;
  size: number;
  radius: number;
  accentColor: string;
  mutedColor: string;
  borderColor: string;
  surfaceAlt: string;
}

const InlineThumbnail = ({
  file,
  size,
  radius,
  mutedColor,
  borderColor,
  surfaceAlt,
}: InlineThumbnailProps) => {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isImage(file)) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius,
        overflow: "hidden",
        background: surfaceAlt,
        border: `1px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={file.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        getFileIcon(file, size * 0.55, mutedColor)
      )}
    </div>
  );
};

// Example usage:
// Basic single file
{
  /* <FileInput label="Resume" accept=".pdf,.doc,.docx" onChange={(f) => setResume(f)} /> */
}

// Image with preview
{
  /* <FileInput label="Avatar" accept="image/*" showPreview onChange={(f) => setAvatar(f as File)} /> */
}

// Multiple files
{
  /* <FileInput label="Documents" multiple maxFiles={5} maxSizeMB={10}
    accept=".pdf,.xlsx" showPreview
    onChange={(files) => setDocs(files as File[])}
    helperText="PDF or Excel, max 10MB each"
/> */
}

// All sizes
{
  /* <FileInput size="sm" label="Small"  accept="image/*" onChange={() => {}} />
<FileInput size="md" label="Medium" accept="image/*" onChange={() => {}} />
<FileInput size="lg" label="Large"  accept="image/*" onChange={() => {}} /> */
}

// Variants
{
  /* <FileInput variant="filled"    label="Filled"    accept="*" onChange={() => {}} /> */
}
{
  /* <FileInput variant="underline" label="Underline" accept="*" onChange={() => {}} /> */
}

// Error state
{
  /* <FileInput label="Invoice" error="File is required" accept=".pdf" onChange={() => {}} /> */
}

// Disabled / ReadOnly
{
  /* <FileInput label="Locked" disabled value={existingFile} onChange={() => {}} /> */
}

// With RHF
{
  /* <FileInput
    label="Profile Photo" name="avatar" accept="image/*"
    register={form.register}
    error={form.formState.errors.avatar?.message}
    onChange={(f) => form.setValue("avatar", f)}
/> */
}
