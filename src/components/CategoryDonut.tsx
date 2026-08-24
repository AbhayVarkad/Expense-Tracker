"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCompactCurrency, formatCurrency, groupByCategory } from "@/lib/expenses";
import type { Expense } from "@/lib/types";
import { chartTooltip } from "./ChartTooltip";
import { EmptyState } from "./EmptyState";

interface CategoryDonutProps {
  expenses: Expense[];
  currency: string;
  rangeLabel: string;
}

export function CategoryDonut({ expenses, currency, rangeLabel }: CategoryDonutProps) {
  const data = useMemo(() => groupByCategory(expenses), [expenses]);
  const total = useMemo(
    () => data.reduce((sum, entry) => sum + entry.total, 0),
    [data],
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section className="card flex flex-col p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Where it goes</h2>
        <span className="text-xs text-muted">{rangeLabel}</span>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="No spending to chart"
          message="Once you add expenses in this period, the category split shows up here."
          compact
        />
      ) : (
        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative size-[190px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                  animationDuration={450}
                  onMouseEnter={(_, index) => setActiveId(data[index]?.id ?? null)}
                  onMouseLeave={() => setActiveId(null)}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.color}
                      opacity={activeId === null || activeId === entry.id ? 1 : 0.4}
                      style={{
                        transition: "opacity 150ms ease-out, transform 150ms ease-out",
                        transformOrigin: "center",
                        transform: activeId === entry.id ? "scale(1.03)" : "scale(1)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={chartTooltip(currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-muted">Total</span>
              <span className="num max-w-28 truncate text-lg font-semibold text-foreground">
                {formatCompactCurrency(total, currency)}
              </span>
            </div>
          </div>

          <ul className="w-full space-y-1 sm:flex-1">
            {data.map((entry) => (
              <li
                key={entry.id}
                onMouseEnter={() => setActiveId(entry.id)}
                onMouseLeave={() => setActiveId(null)}
                className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-all duration-150 ${
                  activeId === entry.id ? "bg-surface-muted" : ""
                } ${activeId !== null && activeId !== entry.id ? "opacity-45" : ""}`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full transition-transform duration-150"
                  style={{
                    backgroundColor: entry.color,
                    transform: activeId === entry.id ? "scale(1.3)" : "scale(1)",
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {entry.label}
                </span>
                <span className="num shrink-0 text-xs font-medium text-foreground">
                  {formatCurrency(entry.total, currency)}
                </span>
                <span className="num w-9 shrink-0 text-right text-[11px] text-muted">
                  {Math.round(entry.share * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
