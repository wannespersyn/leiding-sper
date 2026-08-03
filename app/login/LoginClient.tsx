"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { initials } from "@/lib/avatar";
import type { LoginRosterEntry } from "@/lib/data/persons";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function LoginClient({ roster }: { roster: LoginRosterEntry[] }) {
  const [selected, setSelected] = useState<LoginRosterEntry | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setSelected(null);
    setPin("");
    setError(null);
  }

  function pressKey(key: string) {
    if (isPending) return;
    setError(null);
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH && selected) {
      startTransition(async () => {
        const result = await loginAction(selected.personId, next);
        if (result?.error) {
          setError(result.error);
          setPin("");
        }
      });
    }
  }

  if (!selected) {
    return (
      <main className="flex min-h-dvh flex-col bg-background px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Wie ben jij?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kies je naam om in te loggen.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          {roster.map((person) => (
            <button
              key={person.personId}
              onClick={() => setSelected(person)}
              className="flex flex-col items-center gap-2 rounded-card p-2 text-center transition-opacity active:opacity-60"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-lg font-semibold text-accent">
                {initials(person.name)}
              </span>
              <span className="line-clamp-2 text-sm font-medium text-foreground">
                {person.name}
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <button
          onClick={reset}
          className="text-sm font-medium text-muted-foreground active:opacity-60"
        >
          ← Terug
        </button>
        <ThemeToggle />
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-lg font-semibold text-accent">
          {initials(selected.name)}
        </span>
        <p className="text-lg font-semibold text-foreground">{selected.name}</p>
        <p className="text-sm text-muted-foreground">Voer je pincode in</p>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-accent transition-colors ${
              i < pin.length ? "bg-accent" : "bg-transparent"
            } ${error ? "border-danger" : ""}`}
          />
        ))}
      </div>

      <p className="mt-3 h-5 text-center text-sm font-medium text-danger">
        {error ?? ""}
      </p>

      <div className="mt-auto grid grid-cols-3 gap-4 pt-6">
        {KEYPAD_KEYS.map((key, i) => (
          <button
            key={i}
            disabled={key === "" || isPending}
            onClick={() => pressKey(key)}
            className="flex h-16 items-center justify-center rounded-control bg-surface text-xl font-medium text-foreground shadow-sm transition-opacity active:opacity-60 disabled:opacity-0"
          >
            {key}
          </button>
        ))}
      </div>
    </main>
  );
}
