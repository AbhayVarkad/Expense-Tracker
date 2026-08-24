"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dailyTotals, formatAxisCurrency, formatCompactCurrency } from "@/lib/expenses";
import type { Expense } from "@/lib/types";
import { chartTooltip } from "./ChartTooltip";

interface TrendChartProps {
  /** Always the full expense history so the window is independent of the filters. */
  expenses: Expense[];
  currency: string;
}

const WINDOWS = [7, 14, 30] as const;

export function TrendChart({ expenses, currency }: TrendChartProps) {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(14);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const data = useMemo(() => dailyTotals(expenses, days), [expenses, days]);
  const peak = useMemo(() => Math.max(...data.map((entry) => entry.total), 0), [data]);

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Daily trend</h2>
        <div className="flex gap-1 rounded-full border border-line bg-surface-muted p-0.5">
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              aria-pressed={days === window}
              onClick={() => setDays(window)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                days === window
                  ? "scale-105 bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {window}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border-soft)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={62}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              tickFormatter={(value: number) => formatAxisCurrency(value, currency)}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)", radius: 6 }}
              content={chartTooltip(currency)}
            />
            <Bar
              dataKey="total"
              fill="var(--primary)"
              radius={[6, 6, 2, 2]}
              maxBarSize={30}
              animationDuration={450}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill="var(--primary)"
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                  style={{ transition: "opacity 150ms ease-out" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-1 text-[11px] text-muted">
        {peak > 0
          ? `Busiest day in this window: ${formatCompactCurrency(peak, currency)}`
          : "No spending recorded in this window yet."}
      </p>
    </section>
  );
}
