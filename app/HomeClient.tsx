"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { addEntry, undoEntry } from "./actions/entries";
import { toggleFavorite } from "./actions/favorites";
import { logoutAction } from "./actions/auth";
import { PersonCard } from "@/components/PersonCard";
import { AddEntrySheet } from "@/components/AddEntrySheet";
import { BottomNav } from "@/components/BottomNav";
import { IconLogout } from "@/components/icons";
import type { CategorySummary, PersonSummary } from "@/lib/data/dashboard";
import type { SessionUser } from "@/lib/auth/session";

type OptimisticAction =
  | { type: "add"; personId: string; categoryKey: "bier" | "sterke"; sign: 1 | -1 }
  | { type: "favorite"; personId: string };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goeiemiddag";
  return "Goeienavond";
}

export function HomeClient({
  people,
  categories,
  session,
}: Readonly<{
  people: PersonSummary[];
  categories: CategorySummary[];
  session: SessionUser;
}>) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<{
    entryId: string;
    personId: string;
    categoryKey: "bier" | "sterke";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const catByKey = useMemo(
    () => new Map(categories.map((c) => [c.key, c])),
    [categories],
  );

  const [optimisticPeople, applyOptimistic] = useOptimistic(
    people,
    (state, action: OptimisticAction) =>
      state.map((p) => {
        if (p.id !== action.personId) return p;
        if (action.type === "favorite") return { ...p, isFavorite: !p.isFavorite };

        const cat = catByKey.get(action.categoryKey);
        if (!cat) return p;
        const sign = action.sign;
        const extra = p.type === "extern" ? cat.externExtraCents : 0;
        return {
          ...p,
          bierCount: p.bierCount + (action.categoryKey === "bier" ? sign : 0),
          sterkeCount: p.sterkeCount + (action.categoryKey === "sterke" ? sign : 0),
          totalStreepjes: p.totalStreepjes + sign * cat.streepjeWeight,
          amountCents:
            p.amountCents === null
              ? null
              : p.amountCents + sign * (cat.priceCents + extra),
        };
      }),
  );

  const selectedPerson =
    optimisticPeople.find((p) => p.id === selectedPersonId) ?? null;
  const favorites = optimisticPeople.filter((p) => p.isFavorite);
  const rest = optimisticPeople.filter((p) => !p.isFavorite);

  function closeSheet() {
    setSelectedPersonId(null);
    setLastAdded(null);
  }

  function handleAdd(categoryKey: "bier" | "sterke") {
    if (!selectedPersonId) return;
    const personId = selectedPersonId;
    startTransition(async () => {
      applyOptimistic({ type: "add", personId, categoryKey, sign: 1 });
      const result = await addEntry(personId, categoryKey);
      setLastAdded({ entryId: result.entryId, personId, categoryKey });
    });
  }

  function handleUndo() {
    if (!lastAdded) return;
    const { entryId, personId, categoryKey } = lastAdded;
    setLastAdded(null);
    startTransition(async () => {
      applyOptimistic({ type: "add", personId, categoryKey, sign: -1 });
      await undoEntry(entryId);
    });
  }

  function handleToggleFavorite(personId: string) {
    startTransition(async () => {
      applyOptimistic({ type: "favorite", personId });
      await toggleFavorite(personId);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {getGreeting()}, {session.name.split(" ")[0]}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => startTransition(() => logoutAction())}
            aria-label="Uitloggen"
            className="rounded-xl bg-surface p-2 text-muted-foreground active:opacity-60"
          >
            <IconLogout className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-6">
        {favorites.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Favorieten
            </h2>
            <div className="rounded-card bg-surface px-4">
              {favorites.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onSelect={() => setSelectedPersonId(person.id)}
                  onToggleFavorite={() => handleToggleFavorite(person.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Iedereen
          </h2>
          <div className="rounded-card bg-surface px-4">
            {rest.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onSelect={() => setSelectedPersonId(person.id)}
                onToggleFavorite={() => handleToggleFavorite(person.id)}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />

      <AddEntrySheet
        person={selectedPerson}
        categories={categories}
        isPending={isPending}
        canUndo={lastAdded !== null && lastAdded.personId === selectedPersonId}
        onAdd={handleAdd}
        onUndo={handleUndo}
        onClose={closeSheet}
      />
    </div>
  );
}
