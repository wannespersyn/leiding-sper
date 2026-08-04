"use client";

import { formatCents } from "@/lib/money";
import type { PaymentState } from "@/lib/data/personDetail";

const STATUS_LABEL: Record<PaymentState, string> = {
  none: "Nog niet betaald",
  pending: "Wacht op bevestiging",
  confirmed: "Betaald",
};

export function PaymentStatus({
  periodName,
  amountCents,
  status,
  showToggle,
  pending,
  onToggle,
}: Readonly<{
  periodName: string;
  amountCents: number | null;
  status: PaymentState;
  showToggle: boolean;
  pending?: boolean;
  onToggle?: () => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{periodName}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {amountCents === null ? "—" : formatCents(amountCents)} · {STATUS_LABEL[status]}
        </p>
      </div>
      {showToggle && status !== "confirmed" && (
        <button
          onClick={onToggle}
          disabled={pending}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${
            status === "pending"
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {status === "pending" ? "Maak ongedaan" : "Markeer als betaald"}
        </button>
      )}
    </div>
  );
}
