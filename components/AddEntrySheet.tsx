"use client";

import { initials } from "@/lib/avatar";
import type { CategorySummary, PersonSummary } from "@/lib/data/dashboard";

const CATEGORY_EMOJI: Record<string, string> = { bier: "🍺", sterke: "🥃" };

export function AddEntrySheet({
  person,
  categories,
  isPending,
  canUndo,
  onAdd,
  onUndo,
  onClose,
}: {
  person: PersonSummary | null;
  categories: CategorySummary[];
  isPending: boolean;
  canUndo: boolean;
  onAdd: (categoryKey: "bier" | "sterke") => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  if (!person) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-card bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-sm font-semibold text-accent">
            {initials(person.name)}
          </span>
          <div>
            <p className="font-semibold text-foreground">{person.name}</p>
            <p className="text-sm text-muted-foreground">Streepje toevoegen</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              disabled={isPending}
              onClick={() => onAdd(cat.key)}
              className="flex flex-col items-center gap-2 rounded-card bg-muted py-6 font-semibold text-foreground transition-opacity active:opacity-60 disabled:opacity-50"
            >
              <span className="text-2xl">{CATEGORY_EMOJI[cat.key]}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {canUndo && (
          <button
            onClick={onUndo}
            className="mt-4 w-full rounded-control border border-border py-2.5 text-sm font-medium text-muted-foreground active:opacity-60"
          >
            Laatste streepje ongedaan maken
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-control py-2.5 text-sm font-medium text-accent active:opacity-60"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}
