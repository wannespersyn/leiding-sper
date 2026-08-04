"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";
import { AppHeader, HeaderButton, PageContent } from "@/components/AppHeader";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { initials } from "@/lib/avatar";
import type { LoginRosterEntry } from "@/lib/data/persons";
import { IconChevronLeft } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function LoginClient({ roster }: Readonly<{ roster: LoginRosterEntry[] }>) {
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
      <main className="flex min-h-dvh flex-col bg-background">
        <AppHeader
          className="mb-4"
          title="Wie ben jij?"
          subtitle="Kies je naam om in te loggen."
          trailing={<ThemeToggle variant="header" />}
        />
        <PageContent className="mt-8">
          <div className="grid grid-cols-3 gap-4">
            {roster.map((person) => (
              <button
                key={person.personId}
                type="button"
                onClick={() => setSelected(person)}
                className="flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-opacity active:opacity-60"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-lg font-bold text-accent">
                  {initials(person.name)}
                </span>
                <span className="line-clamp-2 text-sm font-semibold text-foreground">
                  {person.name}
                </span>
              </button>
            ))}
          </div>
        </PageContent>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        className="mb-4"
        title={selected.name}
        subtitle="Voer je pincode in"
        leading={
          <HeaderButton label="Terug" onClick={reset}>
            <IconChevronLeft className="h-6 w-6" />
          </HeaderButton>
        }
        trailing={<ThemeToggle variant="header" />}
      />

      <PageContent className="flex flex-1 flex-col pt-[max(3rem,env(safe-area-inset-top))] pb-8">
        <div className="mt-6 flex flex-col items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent text-lg font-bold text-accent">
            {initials(selected.name)}
          </span>
          <p className="text-lg font-bold text-foreground">{selected.name}</p>
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

        <p className="mt-3 h-5 text-center text-sm font-semibold text-danger">
          {error ?? ""}
        </p>

        <div className="mt-auto grid grid-cols-3 gap-4 pt-6">
          {KEYPAD_KEYS.map((key, i) => (
            <button
              key={key || `empty-${i}`}
              type="button"
              disabled={key === "" || isPending}
              onClick={() => pressKey(key)}
              className="flex h-16 items-center justify-center rounded-full bg-surface text-xl font-semibold text-foreground shadow-sm transition-opacity active:opacity-60 disabled:opacity-0"
            >
              {key}
            </button>
          ))}
        </div>
      </PageContent>
    </main>
  );
}
