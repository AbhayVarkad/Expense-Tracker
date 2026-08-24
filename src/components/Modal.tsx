"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Rendered in the sticky footer, typically the confirm and cancel buttons. */
  footer?: ReactNode;
}

/**
 * Bottom sheet on phones, centred dialog from the `sm` breakpoint up.
 */
export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstField = panelRef.current?.querySelector<HTMLElement>(
      "input:not([type=hidden]), select, textarea, button[data-autofocus]",
    );
    firstField?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl animate-sheet-up sm:max-w-lg sm:rounded-2xl sm:animate-slide-up"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description !== undefined && (
              <p className="mt-0.5 text-xs text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost -mr-2 -mt-1 size-9 rounded-full p-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer !== undefined && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
