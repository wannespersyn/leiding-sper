"use client";

import { initials } from "@/lib/avatar";
import type { PersonSummary } from "@/lib/data/dashboard";
import { IconPlus, IconStar } from "./icons";

export function PersonCard({
  person,
  onSelect,
  onToggleFavorite,
}: Readonly<{
  person: PersonSummary;
  onSelect: () => void;
  onToggleFavorite: () => void;
}>) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-b-0"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-accent text-sm font-semibold text-accent">
        {initials(person.name)}
      </span>

      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
        {person.name}
      </span>

      <button
        aria-label="Favoriet"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`shrink-0 p-1 ${person.isFavorite ? "text-danger" : "text-muted-foreground"}`}
      >
        <IconStar className="h-5 w-5" filled={person.isFavorite} />
      </button>

      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full bg-muted p-1.5 text-muted-foreground"
      >
        <IconPlus className="h-4 w-4" />
      </span>
    </div>
  );
}
