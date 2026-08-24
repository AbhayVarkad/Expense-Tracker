import type {
  Expense as PrismaExpense,
  Profile as PrismaProfile,
  Settings as PrismaSettings,
} from "@/generated/prisma/client";
import type { CategoryId, Expense, PaymentMethod, Profile, Settings } from "./types";

/** Strips the PIN hash and salt so they never leave the server. */
export function toPublicProfile(profile: PrismaProfile): Profile {
  return {
    id: profile.id,
    name: profile.name,
    color: profile.color,
    hasPin: profile.pinHash !== null,
    createdAt: profile.createdAt.getTime(),
  };
}

export function toPublicExpense(expense: PrismaExpense): Expense {
  return {
    id: expense.id,
    amount: Number(expense.amount),
    category: expense.category as CategoryId,
    note: expense.note,
    date: expense.date,
    paymentMethod: expense.paymentMethod as PaymentMethod,
    createdAt: expense.createdAt.getTime(),
  };
}

export function toPublicSettings(settings: PrismaSettings): Settings {
  return {
    currency: settings.currency,
    monthlyBudget: settings.monthlyBudget === null ? null : Number(settings.monthlyBudget),
  };
}
