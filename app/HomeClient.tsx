"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { addEntry, undoEntry } from "./actions/entries";
import { toggleFavorite } from "./actions/favorites";
import { logoutAction } from "./actions/auth";
import { PersonCard } from "@/components/PersonCard";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader, HeaderButton, PageContent } from "@/components/AppHeader";
import { IconLogout, IconSearch } from "@/components/icons";
import { useToast } from "@/components/Toast";
import type { PersonSummary } from "@/lib/data/dashboard";
import type { SessionUser } from "@/lib/auth/session";

// Category's for the points
type CategoryKey = "bier" | "cocktail";

type OptimisticAction =
  | { type: "add"; personId: string; categoryKey: CategoryKey; sign: 1 | -1 }
  | { type: "favorite"; personId: string };

const UNDO_WINDOW_MS = 4000;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goeiemiddag";
  return "Goeienavond";
}

export function HomeClient({
  people,
  session,
}: Readonly<{
  people: PersonSummary[];
  session: SessionUser;
}>) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [lastAdded, setLastAdded] = useState<
    Record<string, { entryId: string; categoryKey: CategoryKey }>
  >({});
  const timers = useMemo(() => new Map<string, ReturnType<typeof setTimeout>>(), []);

  const sessionPerson = people.find((p) => p.id === session.personId);

  const [optimisticPeople, applyOptimistic] = useOptimistic(
    people,
    (state, action: OptimisticAction) =>
      state.map((p) => {
        if (p.id !== action.personId) return p;
        if (action.type === "favorite") return { ...p, isFavorite: !p.isFavorite };

        const sign = action.sign;
        const weight = action.categoryKey === "bier" ? 1 : 2;
        return {
          ...p,
          bierCount: p.bierCount + (action.categoryKey === "bier" ? sign : 0),
          cocktailCount: p.cocktailCount + (action.categoryKey === "cocktail" ? sign : 0),
          totalPoints: p.totalPoints + sign * weight,
          amountCents: p.amountCents === null ? null : p.amountCents,
        };
      }),
  );

  function clearUndo(personId: string) {
    const timer = timers.get(personId);
    if (timer) clearTimeout(timer);
    setLastAdded((prev) => {
      if (!(personId in prev)) return prev;
      const next = { ...prev };
      delete next[personId];
      return next;
    });
  }

  function handleAdd(personId: string, categoryKey: CategoryKey) {
    startTransition(async () => {
      applyOptimistic({ type: "add", personId, categoryKey, sign: 1 });
      const result = await addEntry(personId, categoryKey);
      setLastAdded((prev) => ({ ...prev, [personId]: { entryId: result.entryId, categoryKey } }));
      const existingTimer = timers.get(personId);
      if (existingTimer) clearTimeout(existingTimer);
      timers.set(personId, setTimeout(() => clearUndo(personId), UNDO_WINDOW_MS));
      showToast((categoryKey === "bier" ? "+1 Bier" : "+1 Cocktail") + " toegevoegd");
    });
  }

  function handleUndo(personId: string) {
    const entry = lastAdded[personId];
    if (!entry) return;
    clearUndo(personId);
    startTransition(async () => {
      applyOptimistic({ type: "add", personId, categoryKey: entry.categoryKey, sign: -1 });
      await undoEntry(entry.entryId);
    });
  }

  function handleToggleFavorite(personId: string) {
    startTransition(async () => {
      applyOptimistic({ type: "favorite", personId });
      await toggleFavorite(personId);
    });
  }

  const search_ = search.trim().toLowerCase();
  const filtered = useMemo(
    () => optimisticPeople.filter((p) => p.name.toLowerCase().includes(search_)),
    [optimisticPeople, search_],
  );
  const favoritesList = filtered.filter((p) => p.isFavorite && p.id !== session.personId);
  const rest = filtered.filter((p) => !p.isFavorite && p.id !== session.personId);

  function renderCard(person: PersonSummary) {
    return (
      <PersonCard
        key={person.id}
        person={person}
        showUndo={lastAdded[person.id] !== undefined}
        disabled={isPending}
        onAddBeer={() => handleAdd(person.id, "bier")}
        onAddCocktail={() => handleAdd(person.id, "cocktail")}
        onUndo={() => handleUndo(person.id)}
        onToggleFavorite={() => handleToggleFavorite(person.id)}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        className="mb-4"
        title={`${getGreeting()}, ${session.name.split(" ")[0]}`}
        trailing={
          <HeaderButton
            label="Uitloggen"
            onClick={() => startTransition(() => logoutAction())}
          >
            <IconLogout className="h-5 w-5" />
          </HeaderButton>
        }
      />

      <PageContent className="pb-3">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek een naam..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </PageContent>

      <PageContent className="flex-1 overflow-y-auto pb-6">
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">Jezelf</h2>
          <div className="rounded-2xl bg-surface px-4">{sessionPerson && renderCard(sessionPerson)}</div>
        </section>

        {favoritesList.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-bold text-muted-foreground">Favorieten</h2>
            <div className="rounded-2xl bg-surface px-4">{favoritesList.map(renderCard)}</div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">Iedereen</h2>
          {rest.length > 0 ? (
            <div className="rounded-2xl bg-surface px-4">{rest.map(renderCard)}</div>
          ) : favoritesList.length === 0 ? (
            <p className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground">
              Geen leden gevonden voor &quot;{search}&quot;
            </p>
          ) : null}
        </section>
      </PageContent>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />
    </div>
  );
}
