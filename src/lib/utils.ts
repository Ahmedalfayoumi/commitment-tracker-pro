import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a monetary amount: 1,234.123
 * (Thousands separator: comma, Decimal separator: dot, up to 3 decimal places)
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(amount);
}

/**
 * Formats a date as dd/mm/yyyy
 */
export function formatDate(date: number | string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns the number of days between today and the given date.
 * Positive means future, negative means past.
 */
export function getDaysUntil(date: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a number using Arabic numerals (0-9) with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}