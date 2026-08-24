import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, message, action, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center animate-fade-in ${
        compact === true ? "px-4 py-8" : "px-6 py-14"
      }`}
    >
      <span className="inline-flex size-12 animate-pop-in items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">{message}</p>
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  );
}
