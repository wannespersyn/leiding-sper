"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateCategoryPrice } from "@/app/actions/prices";
import { closePeriod, deletePeriod } from "@/app/actions/periods";
import { removeMember, toggleRole } from "@/app/actions/members";
import { confirmPaid } from "@/app/actions/payments";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader, HeaderLink, PageContent } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QRCode } from "@/components/QRCode";
import { IconChevronLeft, IconTrash, IconX } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { formatCents } from "@/lib/money";
import { TYPE_LABEL } from "@/lib/personType";
import { initials } from "@/lib/avatar";
import type { CategorySummary, CurrentPeriod, PersonSummary } from "@/lib/data/dashboard";
import type { ClosedPeriod } from "@/lib/data/periods";
import type { PendingPayment } from "@/lib/data/payments";
import type { SessionUser } from "@/lib/auth/session";

function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2);
}

function euroStringToCents(value: string): number {
  const parsed = Math.round(Number.parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

type ConfirmState = { message: string; confirmLabel?: string; onConfirm: () => void } | null;

export function AdminClient({
  people,
  categories,
  period,
  closedPeriods,
  pendingPayments,
  session,
}: Readonly<{
  people: PersonSummary[];
  categories: CategorySummary[];
  period: CurrentPeriod;
  closedPeriods: ClosedPeriod[];
  pendingPayments: PendingPayment[];
  session: SessionUser;
}>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [closePeriodOpen, setClosePeriodOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [qrRole, setQrRole] = useState<"leiding" | "extern" | null>(null);
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));

  const [prices, setPrices] = useState(
    Object.fromEntries(
      categories.map((c) => [
        c.id,
        { leiding: centsToEuroString(c.priceLeidingCents), extern: centsToEuroString(c.priceExternCents) },
      ]),
    ),
  );

  function runConfirmed() {
    if (!confirmState) return;
    confirmState.onConfirm();
    setConfirmState(null);
  }

  function handleSavePrices() {
    startTransition(async () => {
      await Promise.all(
        categories.map((c) =>
          updateCategoryPrice(
            c.id,
            euroStringToCents(prices[c.id].leiding),
            euroStringToCents(prices[c.id].extern),
          ),
        ),
      );
      showToast("Prijzen opgeslagen");
      router.refresh();
    });
  }

  function handleCloseperiod() {
    const trimmed = newPeriodName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await closePeriod(trimmed);
      setClosePeriodOpen(false);
      setNewPeriodName("");
      showToast("Periode afgesloten en gearchiveerd");
      router.refresh();
    });
  }

  function handleDeletePeriod(id: string, name: string) {
    setConfirmState({
      message: `Periode "${name}" wordt permanent verwijderd uit de geschiedenis.`,
      onConfirm: () =>
        startTransition(async () => {
          const result = await deletePeriod(id);
          if (result && "error" in result) showToast(result.error);
          else showToast("Periode verwijderd");
          router.refresh();
        }),
    });
  }

  function handleRemoveMember(id: string, name: string) {
    setConfirmState({
      message: `"${name}" wordt permanent verwijderd uit de ledenlijst.`,
      onConfirm: () =>
        startTransition(async () => {
          await removeMember(id);
          showToast("Lid verwijderd");
          router.refresh();
        }),
    });
  }

  function handleToggleRole(id: string) {
    startTransition(async () => {
      await toggleRole(id);
      router.refresh();
    });
  }

  function handleConfirmPayment(personId: string, periodId: string) {
    startTransition(async () => {
      const result = await confirmPaid(personId, periodId);
      if (result && "error" in result) showToast(result.error);
      else showToast("Betaling bevestigd");
      router.refresh();
    });
  }

  const totalOpenCents = people.reduce((sum, p) => sum + (p.amountCents ?? 0), 0);
  const qrValue = qrRole && origin ? `${origin}/join?role=${qrRole}` : "";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        className="mb-4"
        title="Beheer"
        leading={
          <HeaderLink href="/" label="Terug naar startscherm">
            <IconChevronLeft className="h-6 w-6" />
          </HeaderLink>
        }
      />

      <PageContent className="flex-1 overflow-y-auto pb-8 pt-4">
        <h2 className="mb-2 text-sm font-bold text-foreground">Prijzen</h2>
        <div className="mb-6 flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5">
          {categories.map((c) => (
            <div key={c.id} className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-muted-foreground">
                {c.label} · Leiding (€)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={prices[c.id].leiding}
                  onChange={(e) =>
                    setPrices((p) => ({ ...p, [c.id]: { ...p[c.id], leiding: e.target.value } }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                {c.label} · Extern (€)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={prices[c.id].extern}
                  onChange={(e) =>
                    setPrices((p) => ({ ...p, [c.id]: { ...p[c.id], extern: e.target.value } }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={handleSavePrices}
            disabled={isPending}
            className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Prijzen opslaan
          </button>
        </div>

        <h2 className="mb-2 text-sm font-bold text-foreground">Export</h2>
        <a
          href="/admin/export"
          className="mb-6 flex items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          Exporteer CSV
        </a>

        {pendingPayments.length > 0 && (
          <>
            <h2 className="mb-2 text-sm font-bold text-foreground">
              Te bevestigen betalingen ({pendingPayments.length})
            </h2>
            <div className="mb-6 flex flex-col gap-2">
              {pendingPayments.map((p) => (
                <div
                  key={`${p.personId}-${p.periodId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{p.personName}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{p.periodName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConfirmPayment(p.personId, p.periodId)}
                    disabled={isPending}
                    className="shrink-0 rounded-lg bg-success px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Bevestigen
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Periode</h2>
          <span className="text-[11.5px] font-semibold text-muted-foreground">{period.name}</span>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Totaal openstaand: <strong className="text-foreground">{formatCents(totalOpenCents)}</strong>
        </p>

        {!closePeriodOpen ? (
          <button
            type="button"
            onClick={() => setClosePeriodOpen(true)}
            className="mb-3 w-full rounded-xl border-[1.5px] border-danger py-3 text-sm font-bold text-danger"
          >
            Periode afsluiten
          </button>
        ) : (
          <div className="mb-3 rounded-xl border border-border bg-surface p-3.5">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Naam voor de nieuwe periode
            </p>
            <input
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              placeholder="bv. Winter 2026"
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setClosePeriodOpen(false);
                  setNewPeriodName("");
                }}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-bold text-foreground"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleCloseperiod}
                disabled={isPending || !newPeriodName.trim()}
                className="flex-1 rounded-lg bg-danger py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Bevestigen
              </button>
            </div>
          </div>
        )}

        <p className="mb-2 text-xs font-bold text-muted-foreground">Vorige periodes</p>
        <div className="mb-6 flex flex-col gap-2">
          {closedPeriods.length === 0 && (
            <p className="rounded-xl bg-surface p-3.5 text-center text-xs text-muted-foreground">
              Nog geen afgesloten periodes.
            </p>
          )}
          {closedPeriods.map((ph) => (
            <div
              key={ph.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{ph.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {ph.totalPoints} punten · afgesloten{" "}
                  {ph.closedAt.toLocaleDateString("nl-BE")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeletePeriod(ph.id, ph.name)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-danger"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Leden ({people.length})</h2>
          <Link
            href="/admin/add-member"
            className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground"
          >
            + Lid toevoegen
          </Link>
        </div>
        <div className="mb-6 overflow-hidden rounded-xl border border-border bg-surface">
          {people.map((m) => {
            const editable = m.type !== "scouts";
            return (
              <div
                key={m.id}
                className="flex items-center gap-2 border-b border-border px-3 py-2.5 last:border-b-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent text-[11px] font-bold text-accent">
                  {initials(m.name)}
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-foreground">{m.name}</span>
                {editable ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleRole(m.id)}
                      disabled={isPending}
                      className="shrink-0 rounded-lg bg-accent-soft px-2 py-1 text-[10.5px] font-bold text-primary disabled:opacity-50"
                    >
                      {TYPE_LABEL[m.type]}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      aria-label="Verwijderen"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-danger"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground">
                    {TYPE_LABEL[m.type]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="mb-2 text-sm font-bold text-foreground">QR-registratie</h2>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setQrRole("leiding")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${
              qrRole === "leiding" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            QR · Leiding
          </button>
          <button
            type="button"
            onClick={() => setQrRole("extern")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${
              qrRole === "extern" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            QR · Extern
          </button>
        </div>
        {qrRole && (
          <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-surface p-4">
            {qrValue && <QRCode value={qrValue} />}
            <p className="text-center text-[11.5px] font-semibold text-muted-foreground">
              QR-code voor rol: {TYPE_LABEL[qrRole]}
            </p>
            {qrValue && (
              <a href={qrValue} className="text-xs font-bold text-primary">
                Open registratieformulier ↗
              </a>
            )}
          </div>
        )}
      </PageContent>

      <BottomNav personId={session.personId} isAdmin={session.isAdmin} />

      <ConfirmDialog
        open={confirmState !== null}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        pending={isPending}
        onConfirm={runConfirmed}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
