import { useRef, useState } from "react";

interface OtpBoxInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function OtpBoxInput({ length = 6, value, onChange, error }: OtpBoxInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div>
      <div className="flex gap-2.5 justify-center">
        {digits.map((digit, i) => {
          const focused = focusedIndex === i;
          return (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
              inputMode="numeric"
              maxLength={1}
              style={{
                width: 48,
                height: 56,
                textAlign: "center",
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "monospace",
                borderRadius: 10,
                border: `1.5px solid ${error ? "#B0392F" : focused || digit ? "#d4af67" : "#e6e9ef"}`,
                outline: "none",
                color: "#0a1628",
                background: focused ? "#fff" : "#fbfcfe",
                boxShadow: focused ? "0 0 0 3px rgba(212,175,103,.18)" : "none",
                transition: "border-color .15s, box-shadow .15s, background .15s",
              }}
            />
          );
        })}
      </div>
      {error && <div style={{ fontSize: 11.5, color: "#B0392F", marginTop: 8, textAlign: "center" }}>{error}</div>}
    </div>
  );
}
