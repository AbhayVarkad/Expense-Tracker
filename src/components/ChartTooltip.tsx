"use client";

import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/expenses";

/**
 * Recharts calls the returned function with the hovered payload, so the
 * currency has to be captured in a closure rather than passed as a prop.
 */
export function chartTooltip(currency: string) {
  return function TooltipCard({ active, payload, label }: TooltipContentProps) {
    if (active !== true || payload === undefined || payload.length === 0) return null;

    const entry = payload[0];
    const value = typeof entry.value === "number" ? entry.value : 0;
    const title =
      typeof label === "string" && label !== "" ? label : String(entry.name ?? "");

    return (
      <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-xl">
        <p className="text-xs text-muted">{title}</p>
        <p className="num text-sm font-semibold text-foreground">
          {formatCurrency(value, currency)}
        </p>
      </div>
    );
  };
}
