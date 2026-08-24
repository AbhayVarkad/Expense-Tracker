"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { RANGE_LABELS, filterExpenses } from "@/lib/expenses";
import type { Expense, ExpenseFilters } from "@/lib/types";
import { BudgetBar } from "./BudgetBar";
import { CategoryDonut } from "./CategoryDonut";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { Filters } from "./Filters";
import { Header } from "./Header";
import { SettingsModal } from "./SettingsModal";
import { SummaryCards } from "./SummaryCards";
import { TrendChart } from "./TrendChart";

const DEFAULT_FILTERS: ExpenseFilters = { search: "", category: "all", range: "month" };

export function Dashboard() {
  const { expenses, settings } = useProfile();
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const visible = useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);

  const filtersActive =
    filters.search !== "" || filters.category !== "all" || filters.range !== "all";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-10">
      <Header onOpenSettings={() => setSettingsOpen(true)} onAdd={openCreate} />

      <SummaryCards expenses={expenses} currency={settings.currency} />

      <div className="stagger-item" style={{ animationDelay: "80ms" }}>
        <BudgetBar
          expenses={expenses}
          currency={settings.currency}
          monthlyBudget={settings.monthlyBudget}
          onSetBudget={() => setSettingsOpen(true)}
        />
      </div>

      <div className="stagger-item" style={{ animationDelay: "140ms" }}>
        <Filters filters={filters} onChange={setFilters} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="stagger-item" style={{ animationDelay: "180ms" }}>
          <ExpenseList
            expenses={visible}
            currency={settings.currency}
            filtersActive={filtersActive && expenses.length > 0}
            onEdit={openEdit}
            onAdd={openCreate}
          />
        </div>

        <div className="stagger-item space-y-4" style={{ animationDelay: "220ms" }}>
          <CategoryDonut
            expenses={visible}
            currency={settings.currency}
            rangeLabel={RANGE_LABELS[filters.range]}
          />
          <TrendChart expenses={expenses} currency={settings.currency} />
        </div>
      </div>

      <button
        type="button"
        onClick={openCreate}
        aria-label="Add expense"
        className="group btn-primary fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 size-14 animate-ring-pulse rounded-full p-0 shadow-xl sm:hidden"
      >
        <Plus className="size-6 transition-transform duration-300 group-hover:rotate-90" />
      </button>

      <ExpenseForm
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
