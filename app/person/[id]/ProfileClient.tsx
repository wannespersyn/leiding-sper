"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/favorites";
import { deleteEntry } from "@/app/actions/entries";
import { markPaid, unmarkPaid } from "@/app/actions/payments";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader, HeaderLink, PageContent } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/Badge";
import { PaymentStatus } from "@/components/PaymentStatus";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconChevronLeft, IconStar, IconTrash } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { initials } from "@/lib/avatar";
import { TYPE_LABEL } from "@/lib/personType";
import type { PersonDetail } from "@/lib/data/personDetail";
import type { SessionUser } from "@/lib/auth/session";

const CATEGORY_LABEL: Record<"bier" | "cocktail", string> = { bier: "Bier", cocktail: "Cocktail" };

function formatWhen(date: Date) {
  const d = new Date(date);
  const today = new Date();
  const diffDays = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000,
  );
  const dayLabel =
    diffDays === 0
      ? "Vandaag"
      : diffDays === 1
        ? "Gisteren"
        : d.toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
  const timeLabel = d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
  return `${dayLabel} ${timeLabel}`;
}

function chartDayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}

export function ProfileClient({
  detail,
  session,
  isOwnProfile,
}: Readonly<{
  detail: PersonDetail;
  session: SessionUser;
  isOwnProfile: boolean;
}>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(detail.person.isFavorite);
  const [isPending, startTransition] = useTransition();
  const [confirmEntryId, setConfirmEntryId] = useState<string | null>(null);

  const { person } = detail;
  const maxChart = Math.max(1, ...detail.chart.map((c) => c.points));

  function handleToggleFavorite() {
    setIsFavorite((f) => !f);
    startTransition(async () => {
      await toggleFavorite(person.id);
    });
  }

  function handleMarkPaid(periodId: string) {
    startTransition(async () => {
      const result = await markPaid(periodId);
      if (result && "error" in result) showToast(result.error);
      router.refresh();
    });
  }

  function handleUnmarkPaid(periodId: string) {
    startTransition(async () => {
      const result = await unmarkPaid(periodId);
      if (result && "error" in result) showToast(result.error);
      router.refresh();
    });
  }

  function handleDeleteEntry() {
    if (!confirmEntryId) return;
    const entryId = confirmEntryId;
    setConfirmEntryId(null);
    startTransition(async () => {
      const result = await deleteEntry(entryId);
      if (result && "error" in result) showToast(result.error);
      else showToast("Streepje verwijderd");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        className="mb-4"
        title="Profiel"
        leading={
          <HeaderLink href="/" label="Terug naar startscherm">
            <IconChevronLeft className="h-6 w-6" />
          </HeaderLink>
        }
        trailing={<ThemeToggle variant="header" />}
      />

      <PageContent className="flex-1 overflow-y-auto pb-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-14.5 w-14.5 shrink-0 items-center justify-center rounded-full border-2 border-accent text-xl font-extrabold text-accent">
            {initials(person.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-foreground">{person.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-[10.5px] font-bold text-primary">
                {TYPE_LABEL[person.type]}
              </span>
              {person.isAdmin && (
                <span className="rounded-lg bg-primary-dark px-2 py-0.5 text-[10.5px] font-bold text-white">
                  Admin
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isPending}
            aria-label="Favoriet"
            className={`shrink-0 p-1.5 ${isFavorite ? "text-accent" : "text-muted-foreground"}`}
          >
            <IconStar className="h-6 w-6" filled={isFavorite} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="mb-0.5 text-[10.5px] font-semibold text-muted-foreground">Bieren</p>
            <p className="text-xl font-extrabold text-foreground">{person.bierCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="mb-0.5 text-[10.5px] font-semibold text-muted-foreground">Cocktails</p>
            <p className="text-xl font-extrabold text-foreground">{person.cocktailCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="mb-0.5 text-[10.5px] font-semibold text-muted-foreground">Totaal punten</p>
            <p className="text-xl font-extrabold text-primary">{person.totalPoints}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="mb-0.5 text-[10.5px] font-semibold text-muted-foreground">Aanwezig</p>
            <p className="text-xl font-extrabold text-foreground">
              {detail.presentDays}
              <span className="text-xs font-semibold"> dagen</span>
            </p>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-bold text-foreground">Favoriete drank</h2>
        <div className="mb-4 rounded-xl border border-border bg-surface p-3.5">
          <div className="mb-2 flex h-3 overflow-hidden rounded-full">
            <div className="bg-primary" style={{ width: `${detail.beerPct}%` }} />
            <div className="bg-accent" style={{ width: `${detail.cocktailPct}%` }} />
          </div>
          <div className="flex justify-between text-[11.5px] font-semibold text-muted-foreground">
            <span>Bier {detail.beerPct}%</span>
            <span>Cocktail {detail.cocktailPct}%</span>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-bold text-foreground">Punten laatste 14 dagen</h2>
        <div className="mb-4 flex h-17.5 items-end gap-0.75 rounded-xl border border-border bg-surface p-3.5">
          {detail.chart.map((c) => (
            <div
              key={c.date}
              title={`${chartDayLabel(c.date)}: ${c.points}`}
              className="min-h-0.5 flex-1 rounded-t bg-primary"
              style={{ height: `${Math.max(4, Math.round((c.points / maxChart) * 100))}%` }}
            />
          ))}
        </div>

        <h2 className="mb-2 text-sm font-bold text-foreground">Prestaties</h2>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {detail.badges.map((b) => (
            <Badge key={b.key} badge={b} />
          ))}
        </div>

        {person.type !== "scouts" && (
          <>
            <h2 className="mb-2 text-sm font-bold text-foreground">Afrekening</h2>
            <div className="mb-4 flex flex-col gap-2">
              {detail.payments.map((p) => (
                <PaymentStatus
                  key={p.periodId}
                  periodName={p.periodName}
                  amountCents={p.amountCents}
                  status={p.status}
                  showToggle={isOwnProfile}
                  pending={isPending}
                  onToggle={() =>
                    p.status === "pending" ? handleUnmarkPaid(p.periodId) : handleMarkPaid(p.periodId)
                  }
                />
              ))}
            </div>
          </>
        )}

        <h2 className="mb-2 text-sm font-bold text-foreground">Geschiedenis</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {detail.timeline.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Nog geen streepjes.</p>
          ) : (
            detail.timeline.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5 last:border-b-0"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${h.categoryKey === "bier" ? "bg-primary" : "bg-accent"}`}
                />
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {CATEGORY_LABEL[h.categoryKey]}
                </span>
                <span className="text-[11.5px] font-semibold text-muted-foreground">
                  {formatWhen(h.createdAt)}
                </span>
                {h.deletable && (
                  <button
                    type="button"
                    onClick={() => setConfirmEntryId(h.id)}
                    aria-label="Verwijderen"
                    className="shrink-0 p-1 text-muted-foreground"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </PageContent>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />

      <ConfirmDialog
        open={confirmEntryId !== null}
        message="Dit streepje wordt verwijderd."
        confirmLabel="Verwijderen"
        pending={isPending}
        onConfirm={handleDeleteEntry}
        onCancel={() => setConfirmEntryId(null)}
      />
    </div>
  );
}
