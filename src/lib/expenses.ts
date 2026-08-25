import { CATEGORIES, getCategory } from "./categories";
import type { CategoryId, DateRange, Expense, ExpenseFilters } from "./types";

export const MAX_AMOUNT = 100_000_000;
export const MAX_NOTE_LENGTH = 140;
export const MAX_NAME_LENGTH = 24;
export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 8;
export const MAX_DEVICE_PROFILES = 2;
export const MAX_PROFILES_WITH_SAME_NAME = 2;

/** How many device profiles already use this name (case-insensitive). */
export function countProfilesWithName(
  profiles: readonly { name: string }[],
  name: string,
): number {
  const normalized = name.trim().toLowerCase();
  if (normalized === "") return 0;
  return profiles.filter((profile) => profile.name.trim().toLowerCase() === normalized).length;
}

/** Trims, collapses whitespace, strips control characters and caps the length. */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Returns a positive, two-decimal amount, or null when the input is unusable. */
export function parseAmount(input: unknown): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input <= 0 || input > MAX_AMOUNT) return null;
    return Math.round(input * 100) / 100;
  }
  if (typeof input !== "string") return null;
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_AMOUNT) return null;
  return Math.round(parsed * 100) / 100;
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function shiftISODate(value: string, days: number): string {
  const date = fromISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function startOfMonthISO(reference = new Date()): string {
  return toISODate(new Date(reference.getFullYear(), reference.getMonth(), 1));
}

/** Monday-based start of the week containing `reference`. */
export function startOfWeekISO(reference = new Date()): string {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toISODate(date);
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatCompactCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: amount >= 100_000 ? "compact" : "standard",
      maximumFractionDigits: amount >= 100_000 || amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

/** Short enough to fit a chart axis: 14000 becomes the compact form. */
export function formatAxisCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: amount >= 1000 ? "compact" : "standard",
      maximumFractionDigits: amount >= 1000 ? 1 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export function formatDateLabel(value: string): string {
  if (!isValidDateString(value)) return value;
  const today = todayISO();
  if (value === today) return "Today";
  if (value === shiftISODate(today, -1)) return "Yesterday";
  const date = fromISODate(value);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
}

function rangeStart(range: DateRange): string | null {
  switch (range) {
    case "week":
      return startOfWeekISO();
    case "month":
      return startOfMonthISO();
    case "last30":
      return shiftISODate(todayISO(), -29);
    default:
      return null;
  }
}

export const RANGE_LABELS: Record<DateRange, string> = {
  week: "This week",
  month: "This month",
  last30: "Last 30 days",
  all: "All time",
};

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const start = rangeStart(filters.range);
  const search = filters.search.trim().toLowerCase();
  return expenses.filter((expense) => {
    if (start !== null && expense.date < start) return false;
    if (filters.category !== "all" && expense.category !== filters.category) return false;
    if (search !== "") {
      const haystack = `${expense.note} ${getCategory(expense.category).label}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

export function sumAmount(expenses: Expense[]): number {
  return Math.round(expenses.reduce((total, expense) => total + expense.amount, 0) * 100) / 100;
}

export function sumSince(expenses: Expense[], startDate: string): number {
  return sumAmount(expenses.filter((expense) => expense.date >= startDate));
}

export function sumOnDate(expenses: Expense[], date: string): number {
  return sumAmount(expenses.filter((expense) => expense.date === date));
}

/** Inclusive on both ends; both bounds are YYYY-MM-DD strings. */
export function sumBetween(expenses: Expense[], start: string, end: string): number {
  return sumAmount(
    expenses.filter((expense) => expense.date >= start && expense.date <= end),
  );
}

/** Percentage change from `previous` to `current`, or null when there is no base. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface CategoryTotal {
  id: CategoryId;
  label: string;
  color: string;
  total: number;
  share: number;
}

export function groupByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<CategoryId, number>();
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }
  const grandTotal = sumAmount(expenses);
  return CATEGORIES.filter((category) => (totals.get(category.id) ?? 0) > 0)
    .map((category) => {
      const total = Math.round((totals.get(category.id) ?? 0) * 100) / 100;
      return {
        id: category.id,
        label: category.label,
        color: category.color,
        total,
        share: grandTotal > 0 ? total / grandTotal : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export interface DailyTotal {
  date: string;
  label: string;
  total: number;
}

/** Totals for the `days` calendar days ending today, including empty days. */
export function dailyTotals(expenses: Expense[], days: number): DailyTotal[] {
  const today = todayISO();
  const buckets = new Map<string, number>();
  for (let index = days - 1; index >= 0; index -= 1) {
    buckets.set(shiftISODate(today, -index), 0);
  }
  for (const expense of expenses) {
    const current = buckets.get(expense.date);
    if (current !== undefined) buckets.set(expense.date, current + expense.amount);
  }
  return [...buckets.entries()].map(([date, total]) => ({
    date,
    label: fromISODate(date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    total: Math.round(total * 100) / 100,
  }));
}

/** Average daily spend across the days actually covered by the data, capped at 365. */
export function averagePerDay(expenses: Expense[]): number {
  if (expenses.length === 0) return 0;
  const dates = expenses.map((expense) => expense.date).sort();
  const first = fromISODate(dates[0]).getTime();
  const last = fromISODate(dates[dates.length - 1]).getTime();
  const spanDays = Math.min(365, Math.floor((last - first) / 86_400_000) + 1);
  return Math.round((sumAmount(expenses) / Math.max(1, spanDays)) * 100) / 100;
}

/**
 * Escapes a CSV cell. The leading-quote guard stops spreadsheet apps from
 * treating a note such as "=1+1" as a formula.
 */
function csvCell(value: string | number): string {
  const raw = typeof value === "number" ? String(value) : value;
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function toCsv(expenses: Expense[]): string {
  const header = ["Date", "Category", "Amount", "Payment method", "Note"];
  const rows = sortExpenses(expenses).map((expense) => [
    csvCell(expense.date),
    csvCell(getCategory(expense.category).label),
    csvCell(expense.amount.toFixed(2)),
    csvCell(expense.paymentMethod),
    csvCell(expense.note),
  ]);
  return [header.map(csvCell).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
