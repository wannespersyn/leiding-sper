"use client";

import Link from "next/link";
import { initials } from "@/lib/avatar";
import type { PersonSummary } from "@/lib/data/dashboard";
import { IconBeer, IconCocktail, IconStar, IconUndo } from "./icons";

export function PersonCard({
  person,
  showUndo,
  disabled,
  onAddBeer,
  onAddCocktail,
  onUndo,
  onToggleFavorite,
}: Readonly<{
  person: PersonSummary;
  showUndo: boolean;
  disabled?: boolean;
  onAddBeer: () => void;
  onAddCocktail: () => void;
  onUndo: () => void;
  onToggleFavorite: () => void;
}>) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Link
        href={`/person/${person.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent text-xs font-semibold text-accent`}>
          {initials(person.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
            <span className="truncate">{person.name}</span>
          </span>
          <span className="block text-xs font-medium text-muted-foreground">
            {person.totalPoints} ptn
          </span>
        </span>
      </Link>

      <button
        type="button"
        aria-label="Favoriet"
        onClick={onToggleFavorite}
        disabled={disabled}
        className={`shrink-0 p-1 disabled:opacity-50 ${person.isFavorite ? "text-accent" : "text-muted-foreground"}`}
      >
        <IconStar className="h-5 w-5" filled={person.isFavorite} />
      </button>

      {showUndo && (
        <button
          type="button"
          onClick={onUndo}
          disabled={disabled}
          title="Ongedaan maken"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground disabled:opacity-50"
        >
          <IconUndo className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onAddBeer}
        disabled={disabled}
        aria-label="Bier toevoegen"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beer-soft text-primary disabled:opacity-50"
      >
        <IconBeer className="h-4.5 w-4.5" />
      </button>
      <button
        type="button"
        onClick={onAddCocktail}
        disabled={disabled}
        aria-label="Cocktail toevoegen"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-dark disabled:opacity-50"
      >
        <IconCocktail className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
