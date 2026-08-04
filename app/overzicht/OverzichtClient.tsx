"use client";

import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader, PageContent } from "@/components/AppHeader";
import { LeaderboardRow } from "@/components/Leaderboard";
import type { CurrentPeriod, DayBreakdownEntry, PersonSummary } from "@/lib/data/dashboard";
import type { SessionUser } from "@/lib/auth/session";

type SortKey = "points" | "beers" | "cocktails";

function formatDayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}

const SORT_LABEL: Record<SortKey, string> = {
  points: "Punten",
  beers: "Bieren",
  cocktails: "Cocktails",
};

export function OverzichtClient({
  people,
  period,
  dayBreakdown,
  session,
}: Readonly<{
  people: PersonSummary[];
  period: CurrentPeriod;
  dayBreakdown: DayBreakdownEntry[];
  session: SessionUser;
}>) {
  const [sortBy, setSortBy] = useState<SortKey>("points");

  const totalBeers = people.reduce((a, p) => a + p.bierCount, 0);
  const totalCocktails = people.reduce((a, p) => a + p.cocktailCount, 0);
  const totalPoints = people.reduce((a, p) => a + p.totalPoints, 0);

  const sortValue = (p: PersonSummary) =>
    sortBy === "beers" ? p.bierCount : sortBy === "cocktails" ? p.cocktailCount : p.totalPoints;

  const leaderboard = useMemo(() => {
    return people
      .filter((p) => p.type !== "scouts")
      .slice()
      .sort((a, b) => sortValue(b) - sortValue(a));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, sortBy]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader className="mb-4" title="Overzicht" />

      <PageContent className="flex-1 overflow-y-auto pb-6">
        <div className="mt-2 mb-5 rounded-2xl bg-linear-to-br from-primary to-primary-dark p-5 text-white">
          <p className="mb-1 text-xs font-semibold opacity-80">{period.name}</p>
          <p className="mb-2 text-3xl font-extrabold">
            {totalPoints} <span className="text-base font-semibold opacity-75">punten</span>
          </p>
          <div className="flex gap-4 text-xs font-semibold opacity-90">
            <span>{totalBeers} bieren</span>
            <span>{totalCocktails} cocktails</span>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Klassement</h2>
          <div className="flex gap-1">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortBy(key)}
                className={`rounded-lg px-2 py-1 text-[10.5px] font-bold ${
                  sortBy === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {SORT_LABEL[key]}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
          {leaderboard.map((p, i) => (
            <LeaderboardRow key={p.id} rank={i + 1} personId={p.id} name={p.name} value={sortValue(p)} />
          ))}
        </div>

        <h2 className="mb-2 text-sm font-bold text-foreground">Per dag</h2>
        {dayBreakdown.length === 0 ? (
          <p className="rounded-2xl bg-surface p-4 text-center text-sm text-muted-foreground">
            Nog geen streepjes deze periode.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {[...dayBreakdown].reverse().map((d) => (
              <div
                key={d.date}
                className="flex items-center justify-between border-b border-border px-3.5 py-2.5 last:border-b-0"
              >
                <span className="text-sm font-semibold text-foreground">{formatDayLabel(d.date)}</span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {d.bierCount} bier · {d.cocktailCount} cocktail
                </span>
                <span className="text-sm font-extrabold text-primary">{d.points} ptn</span>
              </div>
            ))}
          </div>
        )}
      </PageContent>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />
    </div>
  );
}
