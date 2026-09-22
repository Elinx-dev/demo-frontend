import React from "react";
import { DatePicker, type DatePickerProps } from "../../ui/primitives/Datepicker/Datepicker";

// The globally requested standard date format
export const STANDARD_DATE_FORMAT = "dd-MMM-yyyy";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Format a given date (string, number, or Date object) to standard "01-Jan-2026"
 */
export const formatStandardDate = (value?: string | number | Date | null): string => {
  if (!value) return "";
  
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else {
    const raw = String(value);
    // If it's just a year "2026", return it as is
    if (/^\d{4}$/.test(raw)) return raw;
    
    // Parse "YYYY-MM-DD" reliably to avoid timezone issues
    const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
      date = new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      );
    } else {
      date = new Date(raw);
    }
  }

  if (Number.isNaN(date.getTime())) return String(value);

  const y = date.getFullYear();
  const m = MONTHS_SHORT[date.getMonth()];
  const d = String(date.getDate()).padStart(2, "0");

  return `${d}-${m}-${y}`; // e.g. 01-Jan-2026
};

/**
 * Wrapper component for SHOWING a date
 */
export const StandardDateDisplay = ({ 
  date, 
  fallback = "-" 
}: { 
  date?: string | number | Date | null; 
  fallback?: React.ReactNode;
}) => {
  if (!date) return <>{fallback}</>;
  
  const formatted = formatStandardDate(date);
  return <>{formatted || fallback}</>;
};

/**
 * Wrapper component for ENTERING a date (Replaces <TextField type="date" />)
 */
export const StandardDatePicker = (props: Omit<DatePickerProps, "displayFormat">) => {
  return (
    <DatePicker 
      {...props} 
      displayFormat={STANDARD_DATE_FORMAT} 
    />
  );
};
