"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useProfile } from "@/context/ProfileContext";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/categories";
import {
  MAX_NOTE_LENGTH,
  formatCurrency,
  parseAmount,
  shiftISODate,
  todayISO,
} from "@/lib/expenses";
import type { CategoryId, Expense, PaymentMethod } from "@/lib/types";
import { Modal } from "./Modal";

interface ExpenseFormProps {
  open: boolean;
  /** Null means "create a new expense". */
  editing: Expense | null;
  onClose: () => void;
}

const QUICK_DATES = [
  { label: "Today", offset: 0 },
  { label: "Yesterday", offset: -1 },
];

export function ExpenseForm({ open, editing, onClose }: ExpenseFormProps) {
  const { addExpense, updateExpense, settings } = useProfile();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing !== null) {
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(editing.date);
      setNote(editing.note);
      setPaymentMethod(editing.paymentMethod);
    } else {
      setAmount("");
      setCategory("food");
      setDate(todayISO());
      setNote("");
      setPaymentMethod("upi");
    }
  }, [editing, open]);

  const parsed = parseAmount(amount);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (parsed === null) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const input = { amount: parsed, category, note, date, paymentMethod };
    setSaving(true);
    const saved =
      editing !== null ? await updateExpense(editing.id, input) : await addExpense(input);
    setSaving(false);

    if (!saved) {
      setError("Could not save this expense. Check the amount and try again.");
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title={editing !== null ? "Edit expense" : "Add expense"}
      description={
        editing !== null ? "Update the details and save." : "Log what you just spent."
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-soft w-full sm:w-auto" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="expense-form"
            className="btn-primary w-full sm:w-auto"
            disabled={parsed === null || saving}
          >
            {saving ? "Saving..." : editing !== null ? "Save changes" : "Add expense"}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-line bg-surface-muted p-4 text-center">
          <label htmlFor="expense-amount" className="text-xs font-medium text-muted">
            Amount
          </label>
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <input
              id="expense-amount"
              className="num w-full border-none bg-transparent text-center text-3xl font-semibold text-foreground outline-none placeholder:text-muted/50"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(event) => {
                // Keep only digits and a single decimal point while typing.
                const cleaned = event.target.value
                  .replace(/[^\d.]/g, "")
                  .replace(/(\..*)\./g, "$1");
                setAmount(cleaned);
                setError(null);
              }}
            />
          </div>
          <p className="num mt-1 text-xs text-muted transition-opacity duration-150">
            {parsed === null ? "\u00a0" : formatCurrency(parsed, settings.currency)}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted">Category</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(item.id)}
                  className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 active:scale-95 ${
                    active
                      ? "scale-[1.02] border-primary bg-primary-soft text-foreground shadow-sm"
                      : "border-line bg-surface-muted text-muted hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-110 ${item.chip}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="expense-date" className="text-xs font-medium text-muted">
            Date
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_DATES.map((quick) => {
              const value = shiftISODate(todayISO(), quick.offset);
              return (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => setDate(value)}
                  aria-pressed={date === value}
                  className={`chip border hover:-translate-y-0.5 ${
                    date === value
                      ? "scale-105 border-primary bg-primary-soft text-foreground shadow-sm"
                      : "border-line bg-surface-muted text-muted hover:text-foreground"
                  }`}
                >
                  {quick.label}
                </button>
              );
            })}
          </div>
          <input
            id="expense-date"
            type="date"
            className="field"
            value={date}
            max={todayISO()}
            onChange={(event) => {
              if (event.target.value !== "") setDate(event.target.value);
            }}
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">Paid with</span>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                aria-pressed={paymentMethod === method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`chip border hover:-translate-y-0.5 ${
                  paymentMethod === method.id
                    ? "scale-105 border-primary bg-primary-soft text-foreground shadow-sm"
                    : "border-line bg-surface-muted text-muted hover:text-foreground"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="expense-note" className="text-xs font-medium text-muted">
              Note (optional)
            </label>
            <span className="num text-[11px] text-muted">
              {note.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>
          <input
            id="expense-note"
            className="field"
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="e.g. Lunch with team"
            autoComplete="off"
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        {error !== null && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
