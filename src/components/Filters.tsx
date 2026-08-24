"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { RANGE_LABELS } from "@/lib/expenses";
import type { CategoryId, DateRange, ExpenseFilters } from "@/lib/types";

interface FiltersProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
}

const RANGES: DateRange[] = ["week", "month", "last30", "all"];

export function Filters({ filters, onChange }: FiltersProps) {
  const dirty =
    filters.search !== "" || filters.category !== "all" || filters.range !== "month";

  return (
    <section className="card p-3.5" aria-label="Filters">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="field pl-9"
            type="search"
            value={filters.search}
            placeholder="Search notes and categories"
            aria-label="Search expenses"
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>

        <div className="flex gap-2.5">
          <div className="relative flex-1 sm:flex-none">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <select
              className="field appearance-none pl-9 pr-8 sm:w-44"
              value={filters.category}
              aria-label="Filter by category"
              onChange={(event) =>
                onChange({ ...filters, category: event.target.value as CategoryId | "all" })
              }
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {dirty && (
            <button
              type="button"
              className="btn-soft shrink-0 px-3"
              onClick={() => onChange({ search: "", category: "all", range: "month" })}
            >
              <X className="size-4" />
              <span className="sr-only sm:not-sr-only">Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
        {RANGES.map((range) => (
          <button
            key={range}
            type="button"
            aria-pressed={filters.range === range}
            onClick={() => onChange({ ...filters, range })}
            className={`chip shrink-0 border hover:-translate-y-0.5 ${
              filters.range === range
                ? "scale-105 border-primary bg-primary-soft text-foreground shadow-sm"
                : "border-line bg-surface-muted text-muted hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {RANGE_LABELS[range]}
          </button>
        ))}
      </div>
    </section>
  );
}
