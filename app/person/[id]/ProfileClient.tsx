"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addEntry, undoEntry } from "../../actions/entries";
import { toggleFavorite } from "../../actions/favorites";
import { AddEntrySheet } from "@/components/AddEntrySheet";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconChevronLeft, IconStar } from "@/components/icons";
import { initials } from "@/lib/avatar";
import { formatCents } from "@/lib/money";
import type { CategorySummary } from "@/lib/data/dashboard";
import type { PersonDetail } from "@/lib/data/personDetail";
import type { SessionUser } from "@/lib/auth/session";

const TYPE_LABEL: Record<string, string> = {
  leiding: "Leiding",
  extern: "Extern",
  special: "Groep",
};

export function ProfileClient({
  detail,
  categories,
  session,
}: {
  detail: PersonDetail;
  categories: CategorySummary[];
  session: SessionUser;
}) {
  const [person, setPerson] = useState(detail.person);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<{
    entryId: string;
    categoryKey: "bier" | "sterke";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const catByKey = new Map(categories.map((c) => [c.key, c]));

  function applyDelta(categoryKey: "bier" | "sterke", sign: 1 | -1) {
    const cat = catByKey.get(categoryKey);
    if (!cat) return;
    const extra = person.type === "extern" ? cat.externExtraCents : 0;
    setPerson((p) => ({
      ...p,
      bierCount: p.bierCount + (categoryKey === "bier" ? sign : 0),
      sterkeCount: p.sterkeCount + (categoryKey === "sterke" ? sign : 0),
      totalStreepjes: p.totalStreepjes + sign * cat.streepjeWeight,
      amountCents: p.amountCents === null ? null : p.amountCents + sign * (cat.priceCents + extra),
    }));
  }

  function handleAdd(categoryKey: "bier" | "sterke") {
    startTransition(async () => {
      applyDelta(categoryKey, 1);
      const result = await addEntry(person.id, categoryKey);
      setLastAdded({ entryId: result.entryId, categoryKey });
    });
  }

  function handleUndo() {
    if (!lastAdded) return;
    const { entryId, categoryKey } = lastAdded;
    setLastAdded(null);
    startTransition(async () => {
      applyDelta(categoryKey, -1);
      await undoEntry(entryId);
    });
  }

  function handleToggleFavorite() {
    startTransition(async () => {
      setPerson((p) => ({ ...p, isFavorite: !p.isFavorite }));
      await toggleFavorite(person.id);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2">
        <Link href="/" className="p-1 text-muted-foreground active:opacity-60">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Profiel</h1>
        <ThemeToggle className="ml-auto" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mt-2 flex flex-col items-center gap-3 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent text-2xl font-semibold text-accent">
            {initials(person.name)}
          </span>
          <div>
            <p className="text-xl font-semibold text-foreground">{person.name}</p>
            <p className="text-sm text-muted-foreground">{TYPE_LABEL[person.type]}</p>
          </div>
          <button
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1 text-sm font-medium ${
              person.isFavorite ? "text-danger" : "text-muted-foreground"
            }`}
          >
            <IconStar className="h-4 w-4" filled={person.isFavorite} />
            {person.isFavorite ? "Favoriet" : "Favoriet maken"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 rounded-card bg-surface p-4 text-center">
          <div>
            <p className="text-lg font-semibold text-foreground">{person.totalStreepjes}</p>
            <p className="text-xs text-muted-foreground">Streepjes</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              🍺 {person.bierCount} · 🥃 {person.sterkeCount}
            </p>
            <p className="text-xs text-muted-foreground">Per categorie</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {person.amountCents === null ? "—" : formatCents(person.amountCents)}
            </p>
            <p className="text-xs text-muted-foreground">Openstaand</p>
          </div>
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          className="mt-4 w-full rounded-control bg-accent py-3 text-sm font-semibold text-accent-foreground active:opacity-80"
        >
          Streepje toevoegen
        </button>

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Geschiedenis
          </h2>
          {detail.settlementHistory.length === 0 ? (
            <p className="rounded-card bg-surface p-4 text-sm text-muted-foreground">
              Nog geen afgeronde afrekeningen.
            </p>
          ) : (
            <div className="rounded-card bg-surface px-4">
              {detail.settlementHistory.map((h) => (
                <div
                  key={h.settlementId}
                  className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(h.settledAt).toLocaleDateString("nl-BE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.totalStreepjes} streepjes
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCents(h.amountCents)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />

      <AddEntrySheet
        person={sheetOpen ? person : null}
        categories={categories}
        isPending={isPending}
        canUndo={lastAdded !== null}
        onAdd={handleAdd}
        onUndo={handleUndo}
        onClose={() => {
          setSheetOpen(false);
          setLastAdded(null);
        }}
      />
    </div>
  );
}
