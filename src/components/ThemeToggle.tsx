"use client";

import { Moon, Sun } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";

export function ThemeToggle() {
  const { theme, setTheme } = useProfile();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className="btn-soft size-10 overflow-hidden rounded-full p-0 hover:rotate-12"
    >
      <span
        key={theme}
        className="inline-flex animate-pop-in items-center justify-center"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
    </button>
  );
}
