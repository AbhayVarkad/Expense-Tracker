import type { Theme } from "./types";

const PREFIX = "et:v1";

/**
 * Only UI preferences live in localStorage now: which profile was last open
 * and the light/dark theme. Profiles, expenses and settings all live in the
 * Postgres database behind the API routes.
 */
export const storageKeys = {
  activeProfile: `${PREFIX}:activeProfile`,
  knownProfiles: `${PREFIX}:knownProfiles`,
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

/** Profile ids this browser has created or signed into — not every row in the database. */
export function loadKnownProfileIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(storageKeys.knownProfiles);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map(safeId)
      .filter((entry) => entry !== "");
  } catch {
    return [];
  }
}

export function addKnownProfileId(profileId: string): void {
  if (!isBrowser()) return;
  const id = safeId(profileId);
  if (id === "") return;
  try {
    const current = loadKnownProfileIds();
    if (current.includes(id)) return;
    window.localStorage.setItem(storageKeys.knownProfiles, JSON.stringify([...current, id]));
  } catch {
    // If this fails, the user can still create a new profile.
  }
}

export function removeKnownProfileId(profileId: string): void {
  if (!isBrowser()) return;
  const id = safeId(profileId);
  if (id === "") return;
  try {
    const next = loadKnownProfileIds().filter((entry) => entry !== id);
    window.localStorage.setItem(storageKeys.knownProfiles, JSON.stringify(next));
  } catch {
    // Harmless if the list cannot be updated.
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
