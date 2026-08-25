"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createExpenseRequest,
  createProfileRequest,
  deleteExpenseRequest,
  deleteProfileRequest,
  fetchExpenses,
  fetchProfiles,
  fetchSettings,
  renameProfileRequest,
  unlockProfileRequest,
  updateExpenseRequest,
  updateSettingsRequest,
} from "@/lib/api";
import { MAX_PIN_LENGTH, MIN_PIN_LENGTH, sortExpenses } from "@/lib/expenses";
import { isValidPinFormat } from "@/lib/pin";
import {
  addKnownProfileId,
  loadActiveProfileId,
  loadKnownProfileIds,
  loadTheme,
  removeKnownProfileId,
  saveActiveProfileId,
  saveTheme,
} from "@/lib/storage";
import type { CategoryId, Expense, PaymentMethod, Profile, Settings, Theme } from "@/lib/types";

export interface ExpenseInput {
  amount: string | number;
  category: CategoryId;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
}

interface ProfileContextValue {
  ready: boolean;
  profiles: Profile[];
  myProfiles: Profile[];
  activeProfile: Profile | null;
  expenses: Expense[];
  settings: Settings;
  theme: Theme;
  storageError: string | null;
  dismissStorageError: () => void;
  createProfile: (name: string, color: string, pin: string) => Promise<Profile | null>;
  unlockProfile: (profileId: string, pin: string) => Promise<boolean>;
  lockProfile: () => void;
  renameProfile: (profileId: string, name: string, color: string) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<boolean>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setTheme: (theme: Theme) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULT_SETTINGS: Settings = { currency: "INR", monthlyBudget: null };
const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [theme, setThemeState] = useState<Theme>("light");
  const [storageError, setStorageError] = useState<string | null>(null);
  const [knownProfileIds, setKnownProfileIds] = useState<string[]>([]);

  const myProfiles = useMemo(
    () => profiles.filter((profile) => knownProfileIds.includes(profile.id)),
    [knownProfileIds, profiles],
  );

  useEffect(() => {
    const storedTheme =
      loadTheme() ??
      (typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setThemeState(storedTheme);
    applyTheme(storedTheme);

    let cancelled = false;

    (async () => {
      try {
        const storedProfiles = await fetchProfiles();
        if (cancelled) return;
        setProfiles(storedProfiles);

        const knownIds = loadKnownProfileIds();
        const lastId = loadActiveProfileId();
        const mergedKnownIds =
          lastId !== null && !knownIds.includes(lastId) ? [...knownIds, lastId] : knownIds;
        setKnownProfileIds(mergedKnownIds);

        const candidate =
          lastId === null
            ? null
            : (storedProfiles.find(
                (profile) => profile.id === lastId && mergedKnownIds.includes(profile.id),
              ) ?? null);
        if (candidate !== null && !candidate.hasPin) {
          const [profileExpenses, profileSettings] = await Promise.all([
            fetchExpenses(candidate.id),
            fetchSettings(candidate.id),
          ]);
          if (cancelled) return;
          setActiveProfile(candidate);
          setExpenses(sortExpenses(profileExpenses));
          setSettings(profileSettings);
        }
      } catch {
        if (!cancelled) setStorageError(NETWORK_ERROR);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    saveTheme(next);
  }, []);

  const createProfile = useCallback(
    async (name: string, color: string, pin: string): Promise<Profile | null> => {
      if (pin !== "" && !isValidPinFormat(pin, MIN_PIN_LENGTH, MAX_PIN_LENGTH)) {
        return null;
      }
      try {
        const profile = await createProfileRequest(name, color, pin);
        setProfiles((current) => [...current, profile]);
        addKnownProfileId(profile.id);
        setKnownProfileIds((current) =>
          current.includes(profile.id) ? current : [...current, profile.id],
        );
        setActiveProfile(profile);
        setExpenses([]);
        setSettings(DEFAULT_SETTINGS);
        saveActiveProfileId(profile.id);
        return profile;
      } catch {
        setStorageError(NETWORK_ERROR);
        return null;
      }
    },
    [],
  );

  const unlockProfile = useCallback(
    async (profileId: string, pin: string): Promise<boolean> => {
      const profile = profiles.find((entry) => entry.id === profileId);
      if (profile === undefined) return false;
      try {
        const allowed = await unlockProfileRequest(profileId, pin);
        if (!allowed) return false;
        const [profileExpenses, profileSettings] = await Promise.all([
          fetchExpenses(profileId),
          fetchSettings(profileId),
        ]);
        setActiveProfile(profile);
        setExpenses(sortExpenses(profileExpenses));
        setSettings(profileSettings);
        addKnownProfileId(profileId);
        setKnownProfileIds((current) =>
          current.includes(profileId) ? current : [...current, profileId],
        );
        saveActiveProfileId(profileId);
        return true;
      } catch {
        setStorageError(NETWORK_ERROR);
        return false;
      }
    },
    [profiles],
  );

  const lockProfile = useCallback(() => {
    setActiveProfile(null);
    setExpenses([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const renameProfile = useCallback(
    async (profileId: string, name: string, color: string) => {
      try {
        const updated = await renameProfileRequest(profileId, name, color);
        setProfiles((current) =>
          current.map((profile) => (profile.id === profileId ? updated : profile)),
        );
        setActiveProfile((current) =>
          current !== null && current.id === profileId ? updated : current,
        );
      } catch {
        setStorageError(NETWORK_ERROR);
      }
    },
    [],
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      try {
        await deleteProfileRequest(profileId);
        removeKnownProfileId(profileId);
        setKnownProfileIds((current) => current.filter((id) => id !== profileId));
        setProfiles((current) => current.filter((profile) => profile.id !== profileId));
        setActiveProfile((current) => {
          if (current === null || current.id !== profileId) return current;
          saveActiveProfileId(null);
          setExpenses([]);
          setSettings(DEFAULT_SETTINGS);
          return null;
        });
      } catch {
        setStorageError(NETWORK_ERROR);
      }
    },
    [],
  );

  const addExpense = useCallback(
    async (input: ExpenseInput): Promise<boolean> => {
      if (activeProfile === null) return false;
      try {
        const created = await createExpenseRequest(activeProfile.id, {
          ...input,
          amount: typeof input.amount === "string" ? Number(input.amount) : input.amount,
        });
        setExpenses((current) => sortExpenses([created, ...current]));
        return true;
      } catch {
        setStorageError(NETWORK_ERROR);
        return false;
      }
    },
    [activeProfile],
  );

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput): Promise<boolean> => {
      if (activeProfile === null) return false;
      try {
        const updated = await updateExpenseRequest(id, {
          ...input,
          amount: typeof input.amount === "string" ? Number(input.amount) : input.amount,
        });
        setExpenses((current) =>
          sortExpenses(current.map((expense) => (expense.id === id ? updated : expense))),
        );
        return true;
      } catch {
        setStorageError(NETWORK_ERROR);
        return false;
      }
    },
    [activeProfile],
  );

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await deleteExpenseRequest(id);
      setExpenses((current) => current.filter((expense) => expense.id !== id));
    } catch {
      setStorageError(NETWORK_ERROR);
    }
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (activeProfile === null) return;
      try {
        const updated = await updateSettingsRequest(activeProfile.id, patch);
        setSettings(updated);
      } catch {
        setStorageError(NETWORK_ERROR);
      }
    },
    [activeProfile],
  );

  const dismissStorageError = useCallback(() => setStorageError(null), []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      ready,
      profiles,
      myProfiles,
      activeProfile,
      expenses,
      settings,
      theme,
      storageError,
      dismissStorageError,
      createProfile,
      unlockProfile,
      lockProfile,
      renameProfile,
      deleteProfile,
      addExpense,
      updateExpense,
      deleteExpense,
      updateSettings,
      setTheme,
    }),
    [
      activeProfile,
      addExpense,
      createProfile,
      deleteExpense,
      deleteProfile,
      dismissStorageError,
      expenses,
      lockProfile,
      myProfiles,
      profiles,
      ready,
      renameProfile,
      setTheme,
      settings,
      storageError,
      theme,
      unlockProfile,
      updateExpense,
      updateSettings,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === null) {
    throw new Error("useProfile must be used inside a ProfileProvider");
  }
  return context;
}
