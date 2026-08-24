"use client";

import { Plus, Receipt, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { formatCurrency, formatDateLabel, sortExpenses, sumAmount } from "@/lib/expenses";
import type { Expense } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { ExpenseRow } from "./ExpenseRow";

interface ExpenseListProps {
  expenses: Expense[];
  currency: string;
  /** True when the profile has expenses but the current filters hide them all. */
  filtersActive: boolean;
  onEdit: (expense: Expense) => void;
  onAdd: () => void;
}

const PAGE_SIZE = 50;

export function ExpenseList({
  expenses,
  currency,
  filtersActive,
  onEdit,
  onAdd,
}: ExpenseListProps) {
  const { deleteExpense } = useProfile();
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const groups = useMemo(() => {
    const sorted = sortExpenses(expenses).slice(0, visible);
    const byDate = new Map<string, Expense[]>();
    for (const expense of sorted) {
      const bucket = byDate.get(expense.date);
      if (bucket === undefined) byDate.set(expense.date, [expense]);
      else bucket.push(expense);
    }
    return [...byDate.entries()].map(([date, items]) => ({
      date,
      items,
      total: sumAmount(items),
    }));
  }, [expenses, visible]);

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Transactions</h2>
        <span className="num text-xs text-muted">
          {expenses.length} {expenses.length === 1 ? "entry" : "entries"} &middot;{" "}
          {formatCurrency(sumAmount(expenses), currency)}
        </span>
      </div>

      {expenses.length === 0 ? (
        filtersActive ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches those filters"
            message="Try a different category, a wider date range, or clear the search box."
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            message="Add your first expense and your daily totals, charts and budget will fill in from there."
            action={
              <button type="button" className="btn-primary" onClick={onAdd}>
                <Plus className="size-4" />
                Add expense
              </button>
            }
          />
        )
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-between gap-3 bg-surface-muted/70 px-4 py-2">
                <span className="text-xs font-medium text-foreground">
                  {formatDateLabel(group.date)}
                </span>
                <span className="num text-xs text-muted">
                  {formatCurrency(group.total, currency)}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {group.items.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    currency={currency}
                    onEdit={onEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </ul>
            </div>
          ))}

          {expenses.length > visible && (
            <div className="border-t border-line p-3">
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => setVisible((current) => current + PAGE_SIZE)}
              >
                Show older expenses
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this expense?"
        message={
          pendingDelete === null
            ? ""
            : `${formatCurrency(pendingDelete.amount, currency)} on ${formatDateLabel(
                pendingDelete.date,
              )} will be removed. This cannot be undone.`
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete !== null) void deleteExpense(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
