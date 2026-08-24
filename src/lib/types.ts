export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "health"
  | "entertainment"
  | "education"
  | "home"
  | "travel"
  | "other";

export type PaymentMethod = "cash" | "card" | "upi" | "bank" | "other";

export interface Expense {
  id: string;
  amount: number;
  category: CategoryId;
  note: string;
  /** Local calendar day in YYYY-MM-DD form, kept as a string to stay timezone-stable. */
  date: string;
  paymentMethod: PaymentMethod;
  createdAt: number;
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  /** True when the profile has a PIN lock. The hash itself never reaches the browser. */
  hasPin: boolean;
  createdAt: number;
}

export interface Settings {
  currency: string;
  /** Null means no budget has been set. */
  monthlyBudget: number | null;
}

export type Theme = "light" | "dark";

export type DateRange = "month" | "last30" | "week" | "all";

export interface ExpenseFilters {
  search: string;
  category: CategoryId | "all";
  range: DateRange;
}
