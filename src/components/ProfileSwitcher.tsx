"use client";

import { Check, ChevronDown, LockKeyhole, Plus, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { ProfileAvatar } from "./ProfileAvatar";

interface ProfileSwitcherProps {
  onOpenSettings: () => void;
}

export function ProfileSwitcher({ onOpenSettings }: ProfileSwitcherProps) {
  const { myProfiles, canAddProfile, activeProfile, unlockProfile, lockProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (activeProfile === null) return null;

  const others = myProfiles.filter((profile) => profile.id !== activeProfile.id);

  const switchTo = async (profileId: string, hasPin: boolean) => {
    setOpen(false);
    if (hasPin) {
      // Locking sends the user back to the gate, where the PIN is requested.
      lockProfile();
      return;
    }
    await unlockProfile(profileId, "");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-soft h-10 gap-2 rounded-full pl-1.5 pr-3"
      >
        <ProfileAvatar name={activeProfile.name} color={activeProfile.color} size="sm" />
        <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
          {activeProfile.name}
        </span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-2xl animate-slide-up"
        >
          <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
            <ProfileAvatar name={activeProfile.name} color={activeProfile.color} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{activeProfile.name}</p>
              <p className="text-xs text-muted">Active profile</p>
            </div>
            <Check className="ml-auto size-4 text-success" />
          </div>

          {others.length > 0 && (
            <>
              <div className="my-1 h-px bg-line" />
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                Switch profile
              </p>
              {others.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  role="menuitem"
                  onClick={() => void switchTo(profile.id, profile.hasPin)}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-150 hover:translate-x-0.5 hover:bg-surface-muted"
                >
                  <ProfileAvatar name={profile.name} color={profile.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {profile.name}
                  </span>
                  {profile.hasPin && <LockKeyhole className="size-3.5 text-muted" />}
                </button>
              ))}
            </>
          )}

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-muted"
          >
            <Settings className="size-4 text-muted" />
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              lockProfile();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-muted"
          >
            <LockKeyhole className="size-4 text-muted" />
            Lock profile
          </button>
          {canAddProfile && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                lockProfile();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-muted"
            >
              <Plus className="size-4 text-muted" />
              Add another profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}
