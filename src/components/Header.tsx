"use client";

import { Plus, Wallet } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { ThemeToggle } from "./ThemeToggle";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface HeaderProps {
  onOpenSettings: () => void;
  onAdd: () => void;
}

export function Header({ onOpenSettings, onAdd }: HeaderProps) {
  const { activeProfile } = useProfile();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform duration-300 hover:rotate-6 hover:scale-105 sm:inline-flex">
          <Wallet className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {greeting()}, {activeProfile?.name ?? "there"}
          </p>
          <p className="truncate text-xs text-muted sm:text-sm">{today}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button type="button" className="btn-primary group hidden sm:inline-flex" onClick={onAdd}>
          <Plus className="size-4 transition-transform duration-200 group-active:rotate-90" />
          Add expense
        </button>
        <ThemeToggle />
        <ProfileSwitcher onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
}
