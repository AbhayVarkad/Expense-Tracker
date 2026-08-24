import type { CategoryId, Expense, PaymentMethod, Profile, Settings } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).error === "string"
        ? ((body as Record<string, unknown>).error as string)
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchProfiles(): Promise<Profile[]> {
  return request<Profile[]>("/api/profiles");
}

export function createProfileRequest(name: string, color: string, pin: string): Promise<Profile> {
  return request<Profile>("/api/profiles", {
    method: "POST",
    body: JSON.stringify({ name, color, pin }),
  });
}

export function renameProfileRequest(profileId: string, name: string, color: string): Promise<Profile> {
  return request<Profile>(`/api/profiles/${profileId}`, {
    method: "PATCH",
    body: JSON.stringify({ name, color }),
  });
}

export async function deleteProfileRequest(profileId: string): Promise<void> {
  await request<{ ok: true }>(`/api/profiles/${profileId}`, { method: "DELETE" });
}

export async function unlockProfileRequest(profileId: string, pin: string): Promise<boolean> {
  const response = await fetch(`/api/profiles/${profileId}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return response.ok;
}

export function fetchExpenses(profileId: string): Promise<Expense[]> {
  return request<Expense[]>(`/api/profiles/${profileId}/expenses`);
}

export interface ExpensePayload {
  amount: number;
  category: CategoryId;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
}

export function createExpenseRequest(profileId: string, input: ExpensePayload): Promise<Expense> {
  return request<Expense>(`/api/profiles/${profileId}/expenses`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateExpenseRequest(expenseId: string, input: ExpensePayload): Promise<Expense> {
  return request<Expense>(`/api/expenses/${expenseId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteExpenseRequest(expenseId: string): Promise<void> {
  await request<{ ok: true }>(`/api/expenses/${expenseId}`, { method: "DELETE" });
}

export function fetchSettings(profileId: string): Promise<Settings> {
  return request<Settings>(`/api/profiles/${profileId}/settings`);
}

export function updateSettingsRequest(
  profileId: string,
  patch: Partial<Settings>,
): Promise<Settings> {
  return request<Settings>(`/api/profiles/${profileId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
