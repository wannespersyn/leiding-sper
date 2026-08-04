"use client";

export function ConfirmDialog({
  open,
  message,
  confirmLabel = "Bevestigen",
  pending,
  onConfirm,
  onCancel,
}: Readonly<{
  open: boolean;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Annuleren"
        onClick={onCancel}
        className="absolute inset-0 bg-black/45"
      />
      <div role="alertdialog" aria-modal="true" className="relative w-full max-w-xs rounded-2xl bg-surface p-5">
        <p className="mb-2 text-base font-extrabold text-foreground">Weet je het zeker?</p>
        <p className="mb-4 text-sm leading-snug text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground active:opacity-60"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white active:opacity-80 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
