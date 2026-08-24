"use client";

import { TriangleAlert, X } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { Dashboard } from "./Dashboard";
import { ProfileGate } from "./ProfileGate";

function BootSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-3.5 w-28" />
        </div>
        <div className="skeleton size-10 rounded-full" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="skeleton h-24" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="skeleton h-80" />
        <div className="skeleton h-80" />
      </div>
    </div>
  );
}

export function AppShell() {
  const { ready, activeProfile, storageError, dismissStorageError } = useProfile();

  return (
    <main className="min-h-dvh">
      {!ready ? <BootSkeleton /> : activeProfile !== null ? <Dashboard /> : <ProfileGate />}

      {storageError !== null && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-2xl animate-slide-up"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="flex-1 text-sm leading-relaxed text-foreground">{storageError}</p>
          <button
            type="button"
            onClick={dismissStorageError}
            aria-label="Dismiss"
            className="btn-ghost -mr-1 -mt-1 size-8 rounded-full p-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </main>
  );
}
