"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateCategoryPrice } from "../actions/categories";
import { createSettlement } from "../actions/settlements";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconChevronLeft } from "@/components/icons";
import { formatCents } from "@/lib/money";
import type { CategorySummary, PersonSummary } from "@/lib/data/dashboard";
import type { SessionUser } from "@/lib/auth/session";

function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2);
}

function euroStringToCents(value: string): number {
  const parsed = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function AdminClient({
  people,
  categories,
  session,
}: {
  people: PersonSummary[];
  categories: CategorySummary[];
  session: SessionUser;
}) {
  const [prices, setPrices] = useState(
    Object.fromEntries(
      categories.map((c) => [
        c.id,
        {
          price: centsToEuroString(c.priceCents),
          extra: centsToEuroString(c.externExtraCents),
        },
      ]),
    ),
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [confirmSettlement, setConfirmSettlement] = useState(false);
  const [settledMessage, setSettledMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalOpenCents = people.reduce(
    (sum, p) => sum + (p.amountCents ?? 0),
    0,
  );

  function handleSavePrices() {
    startTransition(async () => {
      await Promise.all(
        categories.map((c) =>
          updateCategoryPrice(
            c.id,
            euroStringToCents(prices[c.id].price),
            euroStringToCents(prices[c.id].extra),
          ),
        ),
      );
      setSavedMessage("Prijzen opgeslagen.");
      setTimeout(() => setSavedMessage(null), 3000);
    });
  }

  function handleSettle() {
    startTransition(async () => {
      await createSettlement();
      setConfirmSettlement(false);
      setSettledMessage("Iedereen is afgerekend en op nul gezet.");
      setTimeout(() => setSettledMessage(null), 5000);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2">
        <Link href="/" className="p-1 text-muted-foreground active:opacity-60">
          <IconChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Beheer</h1>
        <ThemeToggle className="ml-auto" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-6">
        <section className="mt-2">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Prijzen per categorie
          </h2>
          <div className="space-y-4 rounded-card bg-surface p-4">
            {categories.map((c) => (
              <div key={c.id} className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">
                    {c.label} (€)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={prices[c.id].price}
                    onChange={(e) =>
                      setPrices((p) => ({
                        ...p,
                        [c.id]: { ...p[c.id], price: e.target.value },
                      }))
                    }
                    className="w-full rounded-control border border-border bg-background px-3 py-2 text-foreground"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">
                    Extra extern (€)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={prices[c.id].extra}
                    onChange={(e) =>
                      setPrices((p) => ({
                        ...p,
                        [c.id]: { ...p[c.id], extra: e.target.value },
                      }))
                    }
                    className="w-full rounded-control border border-border bg-background px-3 py-2 text-foreground"
                  />
                </label>
              </div>
            ))}
            <button
              onClick={handleSavePrices}
              disabled={isPending}
              className="w-full rounded-control bg-accent py-2.5 text-sm font-semibold text-accent-foreground active:opacity-80 disabled:opacity-50"
            >
              Prijzen opslaan
            </button>
            {savedMessage && (
              <p className="text-center text-sm text-muted-foreground">{savedMessage}</p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Afrekenen
          </h2>
          <div className="rounded-card bg-surface p-4">
            <p className="text-sm text-muted-foreground">Totaal openstaand</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCents(totalOpenCents)}
            </p>

            {!confirmSettlement ? (
              <button
                onClick={() => setConfirmSettlement(true)}
                className="mt-4 w-full rounded-control border border-danger py-2.5 text-sm font-semibold text-danger active:opacity-80"
              >
                Iedereen afrekenen
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-foreground">
                  Zeker? Dit rekent {formatCents(totalOpenCents)} af en zet iedereen terug op nul.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmSettlement(false)}
                    className="flex-1 rounded-control border border-border py-2.5 text-sm font-medium text-muted-foreground active:opacity-60"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleSettle}
                    disabled={isPending}
                    className="flex-1 rounded-control bg-danger py-2.5 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50"
                  >
                    Bevestigen
                  </button>
                </div>
              </div>
            )}
            {settledMessage && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {settledMessage}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Export
          </h2>
          <a
            href="/admin/export"
            className="block w-full rounded-card bg-surface p-4 text-center text-sm font-semibold text-accent active:opacity-80"
          >
            Exporteer als CSV
          </a>
        </section>
      </main>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />
    </div>
  );
}
