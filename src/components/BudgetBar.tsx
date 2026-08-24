"use client";

import { PiggyBank, Target } from "lucide-react";
import { formatCurrency, startOfMonthISO, sumSince } from "@/lib/expenses";
import type { Expense } from "@/lib/types";

interface BudgetBarProps {
  expenses: Expense[];
  currency: string;
  monthlyBudget: number | null;
  onSetBudget: () => void;
}

export function BudgetBar({ expenses, currency, monthlyBudget, onSetBudget }: BudgetBarProps) {
  const spent = sumSince(expenses, startOfMonthISO());

  if (monthlyBudget === null) {
    return (
      <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="icon-tile inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Target className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No monthly budget yet</p>
            <p className="text-xs text-muted">Set one to see how much room you have left.</p>
          </div>
        </div>
        <button type="button" className="btn-soft w-full sm:w-auto" onClick={onSetBudget}>
          Set budget
        </button>
      </section>
    );
  }

  const ratio = monthlyBudget > 0 ? spent / monthlyBudget : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const remaining = Math.round((monthlyBudget - spent) * 100) / 100;
  const over = remaining < 0;
  const near = !over && ratio >= 0.8;

  const barColor = over
    ? "var(--danger)"
    : near
      ? "var(--warning)"
      : "var(--success)";

  const now = new Date();
  const daysLeft =
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="icon-tile inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <PiggyBank className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Monthly budget</p>
            <p className="num text-xs text-muted">
              {formatCurrency(spent, currency)} of {formatCurrency(monthlyBudget, currency)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSetBudget}
          className="rounded-md px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="relative h-full overflow-hidden rounded-full shimmer-bar transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(percent, spent > 0 ? 3 : 0)}%`, backgroundColor: barColor }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Budget used"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span
          className={`num font-medium transition-colors ${
            over ? "text-danger" : near ? "text-warning" : "text-success"
          }`}
        >
          {over
            ? `${formatCurrency(Math.abs(remaining), currency)} over budget`
            : `${formatCurrency(remaining, currency)} left`}
        </span>
        <span className="text-muted">
          {percent}% used &middot; {daysLeft} {daysLeft === 1 ? "day" : "days"} to go
        </span>
      </div>
    </section>
  );
}
