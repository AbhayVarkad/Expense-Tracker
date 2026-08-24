"use client";

import { Pencil, Trash2 } from "lucide-react";
import { getCategory, getPaymentMethodLabel } from "@/lib/categories";
import { formatCurrency } from "@/lib/expenses";
import type { Expense } from "@/lib/types";

interface ExpenseRowProps {
  expense: Expense;
  currency: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseRow({ expense, currency, onEdit, onDelete }: ExpenseRowProps) {
  const category = getCategory(expense.category);
  const Icon = category.icon;
  const title = expense.note === "" ? category.label : expense.note;

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-surface-muted">
      <span
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 ${category.chip}`}
      >
        <Icon className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted">
          {category.label} &middot; {getPaymentMethodLabel(expense.paymentMethod)}
        </p>
      </div>

      <p className="num shrink-0 text-sm font-semibold text-foreground transition-transform duration-200 group-hover:scale-105">
        {formatCurrency(expense.amount, currency)}
      </p>

      <div className="flex shrink-0 items-center gap-0.5 transition-all duration-200 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Edit ${title}`}
          onClick={() => onEdit(expense)}
          className="btn-ghost size-9 rounded-lg p-0 hover:scale-110"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${title}`}
          onClick={() => onDelete(expense)}
          className="btn-ghost size-9 rounded-lg p-0 hover:scale-110 hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
