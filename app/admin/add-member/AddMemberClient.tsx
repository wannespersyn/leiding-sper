"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminAddMember } from "@/app/actions/members";
import { AppHeader, HeaderLink, PageContent } from "@/components/AppHeader";
import { IconChevronLeft } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { PIN_LENGTH } from "@/lib/auth/constants";

export function AddMemberClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"leiding" | "extern">("leiding");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pinValid = new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
  const submitDisabled = name.trim() === "" || !pinValid || pin !== pinConfirm;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await adminAddMember(name, role, pin);
        showToast("Lid geregistreerd");
        router.push("/admin");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registratie mislukt.");
      }
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        className="mb-4"
        title="Nieuw lid"
        leading={
          <HeaderLink href="/admin" label="Terug naar beheer">
            <IconChevronLeft className="h-6 w-6" />
          </HeaderLink>
        }
      />

      <PageContent className="flex-1 py-6">
        <p className="mb-1.5 text-xs font-bold text-muted-foreground">Naam</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Voornaam"
          className="mb-4.5 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-sm text-foreground outline-none"
        />

        <p className="mb-1.5 text-xs font-bold text-muted-foreground">Rol</p>
        <div className="mb-4.5 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("leiding")}
            className={`flex-1 rounded-xl border-[1.5px] py-3 text-sm font-bold ${
              role === "leiding"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            Leiding
          </button>
          <button
            type="button"
            onClick={() => setRole("extern")}
            className={`flex-1 rounded-xl border-[1.5px] py-3 text-sm font-bold ${
              role === "extern"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            Extern
          </button>
        </div>

        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
          Pincode ({PIN_LENGTH} cijfers)
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
      </PageContent>
    </div>
  );
}
