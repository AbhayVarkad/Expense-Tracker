import {
  Bus,
  Clapperboard,
  CreditCard,
  GraduationCap,
  HeartPulse,
  House,
  MoreHorizontal,
  Plane,
  ReceiptText,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId, PaymentMethod } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  /** Used by the charts, which need a raw colour value rather than a class. */
  color: string;
  /** Tailwind classes for the icon chip shown next to each expense. */
  chip: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "food",
    label: "Food & Drink",
    icon: UtensilsCrossed,
    color: "#f97316",
    chip: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  },
  {
    id: "transport",
    label: "Transport",
    icon: Bus,
    color: "#3b82f6",
    chip: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: ShoppingBag,
    color: "#ec4899",
    chip: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
  },
  {
    id: "bills",
    label: "Bills & Utilities",
    icon: ReceiptText,
    color: "#eab308",
    chip: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  },
  {
    id: "health",
    label: "Health",
    icon: HeartPulse,
    color: "#ef4444",
    chip: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Clapperboard,
    color: "#a855f7",
    chip: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "#06b6d4",
    chip: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  },
  {
    id: "home",
    label: "Home & Rent",
    icon: House,
    color: "#14b8a6",
    chip: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  {
    id: "travel",
    label: "Travel",
    icon: Plane,
    color: "#6366f1",
    chip: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  {
    id: "other",
    label: "Other",
    icon: MoreHorizontal,
    color: "#64748b",
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
];

const CATEGORY_MAP = new Map<CategoryId, Category>(
  CATEGORIES.map((category) => [category.id, category]),
);

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);

export function getCategory(id: CategoryId): Category {
  return CATEGORY_MAP.get(id) ?? CATEGORY_MAP.get("other")!;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && CATEGORY_MAP.has(value as CategoryId);
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: LucideIcon }[] = [
  { id: "cash", label: "Cash", icon: CreditCard },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "upi", label: "UPI", icon: CreditCard },
  { id: "bank", label: "Bank transfer", icon: CreditCard },
  { id: "other", label: "Other", icon: CreditCard },
];

const PAYMENT_METHOD_IDS = new Set(PAYMENT_METHODS.map((method) => method.id));

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && PAYMENT_METHOD_IDS.has(value as PaymentMethod);
}

export function getPaymentMethodLabel(id: PaymentMethod): string {
  return PAYMENT_METHODS.find((method) => method.id === id)?.label ?? "Other";
}

export const PROFILE_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];
