"use client";

import { CalendarDays, CalendarRange, Gauge, Sun, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  averagePerDay,
  formatCompactCurrency,
  percentChange,
  shiftISODate,
  startOfMonthISO,
  startOfWeekISO,
  sumBetween,
  sumOnDate,
  sumSince,
  todayISO,
} from "@/lib/expenses";
import type { Expense } from "@/lib/types";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";

interface SummaryCardsProps {
  expenses: Expense[];
  currency: string;
}

interface Metric {
  label: string;
  value: number;
  icon: typeof Sun;
  delta: number | null;
  deltaLabel: string;
}

export function SummaryCards({ expenses, currency }: SummaryCardsProps) {
  const metrics = useMemo<Metric[]>(() => {
    const today = todayISO();
    const yesterday = shiftISODate(today, -1);

    const weekStart = startOfWeekISO();
    const previousWeekStart = shiftISODate(weekStart, -7);
    const previousWeekEnd = shiftISODate(weekStart, -1);

    const monthStart = startOfMonthISO();
    const now = new Date();
    const previousMonthStart = startOfMonthISO(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const previousMonthEnd = shiftISODate(monthStart, -1);

    const todayTotal = sumOnDate(expenses, today);
    const weekTotal = sumSince(expenses, weekStart);
    const monthTotal = sumSince(expenses, monthStart);

    return [
      {
        label: "Today",
        value: todayTotal,
        icon: Sun,
        delta: percentChange(todayTotal, sumOnDate(expenses, yesterday)),
        deltaLabel: "vs yesterday",
      },
      {
        label: "This week",
        value: weekTotal,
        icon: CalendarDays,
        delta: percentChange(
          weekTotal,
          sumBetween(expenses, previousWeekStart, previousWeekEnd),
        ),
        deltaLabel: "vs last week",
      },
      {
        label: "This month",
        value: monthTotal,
        icon: CalendarRange,
        delta: percentChange(
          monthTotal,
          sumBetween(expenses, previousMonthStart, previousMonthEnd),
        ),
        deltaLabel: "vs last month",
      },
      {
        label: "Average / day",
        value: averagePerDay(expenses),
        icon: Gauge,
        delta: null,
        deltaLabel: "across your history",
      },
    ];
  }, [expenses]);

  return (
    <section aria-label="Spending summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <SummaryCard key={metric.label} metric={metric} currency={currency} delayMs={index * 60} />
      ))}
    </section>
  );
}

function SummaryCard({
  metric,
  currency,
  delayMs,
}: {
  metric: Metric;
  currency: string;
  delayMs: number;
}) {
  const Icon = metric.icon;
  const up = metric.delta !== null && metric.delta > 0;
  const down = metric.delta !== null && metric.delta < 0;
  const animatedValue = useAnimatedNumber(metric.value);

  return (
    <article
      className="card card-interactive stagger-item p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{metric.label}</p>
        <span className="icon-tile inline-flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="num mt-2.5 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {formatCompactCurrency(animatedValue, currency)}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
        {metric.delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 font-medium transition-colors ${
              up ? "text-danger" : down ? "text-success" : "text-muted"
            }`}
          >
            {up ? (
              <TrendingUp className="size-3" />
            ) : down ? (
              <TrendingDown className="size-3" />
            ) : null}
            {Math.abs(metric.delta)}%
          </span>
        )}
        <span className="truncate">{metric.deltaLabel}</span>
      </p>
    </article>
  );
}
