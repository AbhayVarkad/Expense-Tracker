"use client";

import { Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { MAX_NAME_LENGTH, parseAmount, toCsv, todayISO } from "@/lib/expenses";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const {
    activeProfile,
    expenses,
    settings,
    updateSettings,
    renameProfile,
    deleteProfile,
  } = useProfile();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(settings.currency);
  const [budget, setBudget] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open || activeProfile === null) return;
    setName(activeProfile.name);
    setCurrency(settings.currency);
    setBudget(settings.monthlyBudget === null ? "" : String(settings.monthlyBudget));
  }, [activeProfile, open, settings.currency, settings.monthlyBudget]);

  if (activeProfile === null) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed !== "" && trimmed !== activeProfile.name) {
      await renameProfile(activeProfile.id, trimmed, activeProfile.color);
    }
    await updateSettings({
      currency,
      monthlyBudget: budget.trim() === "" ? null : parseAmount(budget),
    });
    onClose();
  };

  const handleExport = () => {
    // Built entirely from local state; no user input reaches a path or shell.
    const blob = new Blob([`\uFEFF${toCsv(expenses)}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const safeName = activeProfile.name.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 24) || "profile";
    const link = document.createElement("a");
    link.href = url;
    link.download = `spendly-${safeName}-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Modal
        open={open}
        title="Settings"
        description="These settings apply to this profile only."
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn-soft w-full sm:w-auto" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary w-full sm:w-auto"
              onClick={() => void handleSave()}
            >
              Save settings
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="settings-name" className="text-xs font-medium text-muted">
              Profile name
            </label>
            <input
              id="settings-name"
              className="field"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-currency" className="text-xs font-medium text-muted">
              Currency
            </label>
            <select
              id="settings-currency"
              className="field"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {CURRENCIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-budget" className="text-xs font-medium text-muted">
              Monthly budget
            </label>
            <input
              id="settings-budget"
              className="field num"
              inputMode="decimal"
              placeholder="Leave empty for no budget"
              value={budget}
              autoComplete="off"
              onChange={(event) =>
                setBudget(event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))
              }
            />
          </div>

          <div className="space-y-2 rounded-xl border border-line bg-surface-muted p-3.5">
            <p className="text-xs font-medium text-foreground">Your data</p>
            <p className="text-[11px] leading-relaxed text-muted">
              Expenses are saved to the database, so they follow this profile across devices and
              browsers. Export a copy any time you want an offline backup.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-soft flex-1"
                onClick={handleExport}
                disabled={expenses.length === 0}
              >
                <Download className="size-4" />
                Export CSV
              </button>
              <button
                type="button"
                className="btn-ghost flex-1 text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete profile
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${activeProfile.name}?`}
        message="This permanently removes the profile and every expense saved under it from the database. Export a CSV first if you want a copy."
        confirmLabel="Delete profile"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onClose();
          void deleteProfile(activeProfile.id);
        }}
      />
    </>
  );
}
