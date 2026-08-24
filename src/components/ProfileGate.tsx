"use client";

import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useProfile } from "@/context/ProfileContext";
import { PROFILE_COLORS } from "@/lib/categories";
import { MAX_NAME_LENGTH, MAX_PIN_LENGTH, MIN_PIN_LENGTH } from "@/lib/expenses";
import { isValidPinFormat } from "@/lib/pin";
import type { Profile } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ProfileAvatar } from "./ProfileAvatar";
import { ThemeToggle } from "./ThemeToggle";

type View = "picker" | "create" | "unlock";

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
  const { profiles, createProfile, unlockProfile, deleteProfile } = useProfile();
  const [view, setView] = useState<View>(profiles.length === 0 ? "create" : "picker");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [managing, setManaging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const resetCreateForm = () => {
    setName("");
    setColor(PROFILE_COLORS[profiles.length % PROFILE_COLORS.length]);
    setNewPin("");
    setConfirmPin("");
    setCreateError(null);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setCreateError("Give this profile a name.");
      return;
    }
    if (newPin !== "") {
      if (!isValidPinFormat(newPin, MIN_PIN_LENGTH, MAX_PIN_LENGTH)) {
        setCreateError(`Use ${MIN_PIN_LENGTH} to ${MAX_PIN_LENGTH} digits, or leave the PIN empty.`);
        return;
      }
      if (newPin !== confirmPin) {
        setCreateError("The two PINs do not match.");
        return;
      }
    }

    setBusy(true);
    const created = await createProfile(trimmed, color, newPin);
    setBusy(false);
    if (created === null) {
      setCreateError("Could not create the profile. Try a different name.");
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
              {profiles.length === 0 ? "Create your profile" : "Add a profile"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Each profile keeps its own expenses in this browser.
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
              placeholder="e.g. Varun"
              autoComplete="off"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-surface-muted p-3.5">
            <div className="flex items-center gap-2">
              <Lock className="size-3.5 text-muted" />
              <span className="text-xs font-medium text-foreground">PIN (optional)</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="field bg-surface"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder={`${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`}
                value={newPin}
                maxLength={MAX_PIN_LENGTH}
                onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
              />
              <input
                className="field bg-surface"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="Repeat PIN"
                value={confirmPin}
                maxLength={MAX_PIN_LENGTH}
                disabled={newPin === ""}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              A PIN keeps other people from opening your profile by accident. It is a
              convenience lock, not real security.
            </p>
          </div>

          {createError !== null && <p className="text-sm text-danger">{createError}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {profiles.length > 0 && (
              <button
                type="button"
                className="btn-soft w-full sm:w-auto"
                onClick={() => {
                  resetCreateForm();
                  setView("picker");
                }}
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            )}
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
              {busy ? "Creating..." : "Create profile"}
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
                setView("picker");
              }}
            >
              <ArrowLeft className="size-4" />
              All profiles
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={busy || pin.length < MIN_PIN_LENGTH}
            >
              Unlock
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
          <h2 className="text-lg font-semibold text-foreground">Who is spending?</h2>
          {profiles.length > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setManaging((current) => !current)}
            >
              {managing ? "Done" : "Manage"}
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {profiles.map((profile, index) => (
            <li
              key={profile.id}
              className="stagger-item flex items-center gap-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                type="button"
                onClick={() => void openProfile(profile)}
                className="group flex flex-1 items-center gap-3 rounded-xl border border-line bg-surface-muted px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft hover:shadow-md active:translate-y-0 active:scale-[0.99]"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  <ProfileAvatar name={profile.name} color={profile.color} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {profile.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    {profile.hasPin ? (
                      <>
                        <Lock className="size-3" /> PIN protected
                      </>
                    ) : (
                      "No PIN"
                    )}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
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

        <p className="text-[11px] leading-relaxed text-muted">
          Expenses are saved to the database and follow each profile across devices. PINs are just
          a convenience lock between people sharing this app.
        </p>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "profile"}?`}
        message="This permanently removes the profile and every expense saved under it in this browser. This cannot be undone."
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
