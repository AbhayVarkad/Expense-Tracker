"use client";

import {
  ArrowLeft,
  Lock,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useProfile } from "@/context/ProfileContext";
import { PROFILE_COLORS } from "@/lib/categories";
import {
  MAX_DEVICE_PROFILES,
  MAX_NAME_LENGTH,
  MAX_PIN_LENGTH,
  MAX_PROFILES_WITH_SAME_NAME,
  MIN_PIN_LENGTH,
  countProfilesWithName,
} from "@/lib/expenses";
import { isValidPinFormat } from "@/lib/pin";
import type { Profile } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ProfileAvatar } from "./ProfileAvatar";
import { ThemeToggle } from "./ThemeToggle";

type View = "create" | "signin" | "unlock" | "remote";

function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center animate-slide-up">
          <span className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform duration-300 hover:rotate-6 hover:scale-105">
            <Wallet className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Spendly</h1>
          <p className="mt-1 text-sm text-muted">Track every rupee, wherever you sign in.</p>
        </div>
        <div className="card p-5 animate-slide-up sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function ProfileGate() {
  const { myProfiles, canAddProfile, createProfile, signInWithCredentials, unlockProfile, deleteProfile } =
    useProfile();
  const [view, setView] = useState<View>(() => (myProfiles.length === 0 ? "create" : "signin"));
  const [selected, setSelected] = useState<Profile | null>(null);
  const [managing, setManaging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);

  useEffect(() => {
    if (myProfiles.length === 0 && view === "signin") {
      setView("create");
    }
  }, [myProfiles.length, view]);

  const [name, setName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const resetCreateForm = () => {
    setName("");
    setNewPin("");
    setCreateError(null);
    setRemoteError(null);
  };

  const handleRemoteSignIn = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setRemoteError("Enter your name.");
      return;
    }
    if (!isValidPinFormat(newPin, MIN_PIN_LENGTH, MAX_PIN_LENGTH)) {
      setRemoteError(`Enter a ${MIN_PIN_LENGTH} to ${MAX_PIN_LENGTH} digit PIN.`);
      return;
    }

    setBusy(true);
    const error = await signInWithCredentials(trimmed, newPin);
    setBusy(false);
    if (error !== null) {
      setRemoteError(error);
      return;
    }
    resetCreateForm();
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setCreateError("Enter your name to continue.");
      return;
    }
    if (!canAddProfile) {
      setCreateError(
        `This device already has ${MAX_DEVICE_PROFILES} profiles. Remove one before adding another.`,
      );
      return;
    }
    if (countProfilesWithName(myProfiles, trimmed) >= MAX_PROFILES_WITH_SAME_NAME) {
      setCreateError(
        `You can only have ${MAX_PROFILES_WITH_SAME_NAME} profiles named "${trimmed}" on this device.`,
      );
      return;
    }
    if (!isValidPinFormat(newPin, MIN_PIN_LENGTH, MAX_PIN_LENGTH)) {
      setCreateError(`Enter a ${MIN_PIN_LENGTH} to ${MAX_PIN_LENGTH} digit PIN.`);
      return;
    }

    setBusy(true);
    const color = PROFILE_COLORS[myProfiles.length % PROFILE_COLORS.length];
    const created = await createProfile(trimmed, color, newPin);
    setBusy(false);
    if (created === null) {
      setCreateError("Could not create your account. Try again.");
      return;
    }
    resetCreateForm();
  };

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    if (selected === null) return;
    setBusy(true);
    const opened = await unlockProfile(selected.id, pin);
    setBusy(false);
    if (!opened) {
      setPin("");
      setPinError("That PIN is not right. Try again.");
    }
  };

  const openProfile = async (profile: Profile) => {
    if (!profile.hasPin) {
      await unlockProfile(profile.id, "");
      return;
    }
    setSelected(profile);
    setPin("");
    setPinError(null);
    setView("unlock");
  };

  if (view === "create") {
    return (
      <GateFrame>
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {myProfiles.length === 0 ? "Create your account" : "Add profile"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {myProfiles.length === 0
                ? "Enter your name and PIN to get started."
                : `Up to ${MAX_DEVICE_PROFILES} profiles per device.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-xs font-medium text-muted">
              Name
            </label>
            <input
              id="profile-name"
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-pin" className="text-xs font-medium text-muted">
              PIN
            </label>
            <input
              id="profile-pin"
              className="field"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder={`${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`}
              value={newPin}
              maxLength={MAX_PIN_LENGTH}
              onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
            />
          </div>

          {createError !== null && <p className="text-sm text-danger">{createError}</p>}

          <div className="space-y-3">
            <button type="submit" className="btn-primary w-full" disabled={busy || !canAddProfile}>
              {busy
                ? "Creating..."
                : myProfiles.length === 0
                  ? "Create account"
                  : "Add profile"}
            </button>

            {myProfiles.length > 0 && (
              <button
                type="button"
                className="btn-ghost w-full text-sm"
                onClick={() => {
                  resetCreateForm();
                  setManaging(false);
                  setView("signin");
                }}
              >
                <ArrowLeft className="size-4" />
                Back to your profiles
              </button>
            )}

            {myProfiles.length === 0 && (
              <button
                type="button"
                className="btn-ghost w-full text-sm"
                onClick={() => {
                  resetCreateForm();
                  setView("remote");
                }}
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </form>
      </GateFrame>
    );
  }

  if (view === "remote") {
    return (
      <GateFrame>
        <form onSubmit={handleRemoteSignIn} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sign in on this device</h2>
            <p className="mt-1 text-sm text-muted">
              Use the same name and PIN from your other device. Your expenses will load from the
              cloud.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="remote-name" className="text-xs font-medium text-muted">
              Name
            </label>
            <input
              id="remote-name"
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="remote-pin" className="text-xs font-medium text-muted">
              PIN
            </label>
            <input
              id="remote-pin"
              className="field"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder={`${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`}
              value={newPin}
              maxLength={MAX_PIN_LENGTH}
              onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
            />
          </div>

          {remoteError !== null && <p className="text-sm text-danger">{remoteError}</p>}

          <div className="space-y-3">
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              className="btn-ghost w-full text-sm"
              onClick={() => {
                resetCreateForm();
                setView(myProfiles.length === 0 ? "create" : "signin");
              }}
            >
              <ArrowLeft className="size-4" />
              {myProfiles.length === 0 ? "Create a new account" : "Back to your profiles"}
            </button>
          </div>
        </form>
      </GateFrame>
    );
  }

  if (view === "unlock" && selected !== null) {
    return (
      <GateFrame>
        <form onSubmit={handleUnlock} className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar name={selected.name} color={selected.color} size="lg" />
            <h2 className="mt-3 text-lg font-semibold text-foreground">{selected.name}</h2>
            <p className="mt-1 text-sm text-muted">Enter your PIN to continue.</p>
          </div>

          <input
            className={`field text-center text-lg tracking-[0.5em] ${
              pinError !== null ? "animate-shake border-danger" : ""
            }`}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={MAX_PIN_LENGTH}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, ""));
              setPinError(null);
            }}
            placeholder="••••"
            aria-label="PIN"
          />

          {pinError !== null && (
            <p className="text-center text-sm text-danger" role="alert">
              {pinError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
              onClick={() => {
                setSelected(null);
                setPin("");
                setPinError(null);
                setView("signin");
              }}
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={busy || pin.length < MIN_PIN_LENGTH}
            >
              Sign in
            </button>
          </div>
        </form>
      </GateFrame>
    );
  }

  return (
    <GateFrame>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
            <p className="mt-1 text-sm text-muted">
              {myProfiles.length} of {MAX_DEVICE_PROFILES} profiles on this device
            </p>
          </div>
          {myProfiles.length > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setManaging((current) => !current)}
            >
              {managing ? "Done" : "Manage"}
            </button>
          )}
        </div>

        {myProfiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center">
            <p className="text-sm text-muted">No profiles on this device yet.</p>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => {
                resetCreateForm();
                setView("create");
              }}
            >
              Create account
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {myProfiles.map((profile, index) => (
              <li
                key={profile.id}
                className="stagger-item flex items-center gap-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  type="button"
                  onClick={() => void openProfile(profile)}
                  className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft hover:shadow-md active:translate-y-0 active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {profile.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Lock className="size-3" />
                      {profile.hasPin ? "••••" : "No PIN set"}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Sign in
                  </span>
                </button>
                {managing && (
                  <button
                    type="button"
                    aria-label={`Delete ${profile.name}`}
                    className="btn-ghost size-11 shrink-0 rounded-xl p-0 text-danger hover:scale-105 hover:bg-danger/10 hover:text-danger"
                    onClick={() => setPendingDelete(profile)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canAddProfile ? (
          <>
            <button
              type="button"
              className="btn-soft w-full border-dashed"
              onClick={() => {
                resetCreateForm();
                setManaging(false);
                setView("create");
              }}
            >
              <Plus className="size-4" />
              Add profile
            </button>
            <button
              type="button"
              className="btn-ghost w-full text-sm"
              onClick={() => {
                resetCreateForm();
                setManaging(false);
                setView("remote");
              }}
            >
              Sign in from another device
            </button>
          </>
        ) : (
          <p className="rounded-xl border border-line bg-surface-muted px-4 py-3 text-center text-xs text-muted">
            This device already has {MAX_DEVICE_PROFILES} profiles. Remove one to add another.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "profile"}?`}
        message="This permanently removes the profile and every expense saved under it. This cannot be undone."
        confirmLabel="Delete profile"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete !== null) void deleteProfile(pendingDelete.id);
          setPendingDelete(null);
          setManaging(false);
        }}
      />
    </GateFrame>
  );
}
