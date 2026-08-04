"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { selfRegister } from "@/app/actions/members";
import { AppHeader, PageContent } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { TYPE_LABEL } from "@/lib/personType";

export function JoinClient({ role }: Readonly<{ role: "leiding" | "extern" }>) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pinValid = new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
  const submitDisabled = name.trim() === "" || !pinValid || pin !== pinConfirm;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await selfRegister(name, role, pin);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        className="mb-6"
        title="Welkom!"
        subtitle="Registreer je voor Staftracker."
        trailing={<ThemeToggle variant="header" />}
      />

      <PageContent className="flex-1 pb-8">
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-accent-soft p-3.5">
          <p className="text-sm font-semibold text-primary">
            Je registreert je als <strong>{TYPE_LABEL[role]}</strong>
          </p>
        </div>

        <p className="mb-1.5 text-xs font-bold text-muted-foreground">Naam</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Voornaam"
          className="mb-4.5 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-sm text-foreground outline-none"
        />

        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
          Kies een pincode ({PIN_LENGTH} cijfers)
        </p>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
          inputMode="numeric"
          placeholder="••••"
          className="mb-4.5 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-sm tracking-widest text-foreground outline-none"
        />

        <p className="mb-1.5 text-xs font-bold text-muted-foreground">Bevestig pincode</p>
        <input
          value={pinConfirm}
          onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
          inputMode="numeric"
          placeholder="••••"
          className="mb-2 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-sm tracking-widest text-foreground outline-none"
        />

        {error && <p className="mb-3 text-sm font-semibold text-danger">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitDisabled || isPending}
          className="mt-3 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          Registreren
        </button>

        <Link
          href="/login"
          className="mt-4 text-center text-xs font-semibold text-muted-foreground"
        >
          Al een account? Log in
        </Link>
      </PageContent>
    </main>
  );
}
