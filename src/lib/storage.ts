import type { Theme } from "./types";

const PREFIX = "et:v1";

/**
 * Only UI preferences live in localStorage now: which profile was last open
 * and the light/dark theme. Profiles, expenses and settings all live in the
 * Postgres database behind the API routes.
 */
export const storageKeys = {
  activeProfile: `${PREFIX}:activeProfile`,
  theme: `${PREFIX}:theme`,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Profile ids come from the server, but this keeps a corrupted value from doing anything odd. */
function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
}

export function loadActiveProfileId(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKeys.activeProfile);
    return raw === null ? null : safeId(raw) || null;
  } catch {
    return null;
  }
}

export function saveActiveProfileId(profileId: string | null): void {
  if (!isBrowser()) return;
  try {
    if (profileId === null) {
      window.localStorage.removeItem(storageKeys.activeProfile);
    } else {
      window.localStorage.setItem(storageKeys.activeProfile, safeId(profileId));
    }
  } catch {
    // Losing the "last used profile" hint is harmless.
  }
}

export function loadTheme(): Theme | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKeys.theme);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(storageKeys.theme, theme);
  } catch {
    // Theme preference simply will not persist.
  }
}
