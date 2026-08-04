"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accounts } from "@/db/schema";
import { verifyPin } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export async function loginAction(
  personId: string,
  pin: string,
): Promise<{ error: string } | never> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.personId, personId))
    .limit(1);

  if (!account) {
    return { error: "Onbekende gebruiker." };
  }

  if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
    const secondsLeft = Math.ceil(
      (account.lockedUntil.getTime() - Date.now()) / 1000,
    );
    return { error: `Te veel pogingen. Probeer opnieuw in ${secondsLeft}s.` };
  }

  const valid = verifyPin(pin, account.pinHash, account.pinSalt);

  if (!valid) {
    const attempts = account.failedAttempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db
        .update(accounts)
        .set({
          failedAttempts: 0,
          lockedUntil: new Date(Date.now() + LOCKOUT_MS),
        })
        .where(eq(accounts.id, account.id));
    } else {
      await db
        .update(accounts)
        .set({ failedAttempts: attempts })
        .where(eq(accounts.id, account.id));
    }
    return { error: "Onjuiste pincode." };
  }

  await db
    .update(accounts)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(accounts.id, account.id));

  await createSession(account.id);
  redirect("/");
}
