"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { categories, entries } from "@/db/schema";
import { getCurrentPeriod } from "@/lib/data/dashboard";
import { requireSession } from "@/lib/auth/session";

function revalidateAfterEntryChange(personId: string) {
  revalidatePath("/");
  revalidatePath("/overzicht");
  revalidatePath(`/person/${personId}`);
}

export async function addEntry(
  personId: string,
  categoryKey: "bier" | "cocktail",
): Promise<{ entryId: string }> {
  const session = await requireSession();
  const period = await getCurrentPeriod();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.key, categoryKey))
    .limit(1);
  if (!category) throw new Error("Onbekende categorie.");

  const [entry] = await db
    .insert(entries)
    .values({
      personId,
      categoryId: category.id,
      periodId: period.id,
      addedByAccountId: session.accountId,
    })
    .returning();

  revalidateAfterEntryChange(personId);

  return { entryId: entry.id };
}

export async function undoEntry(
  entryId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await requireSession();
  const period = await getCurrentPeriod();

  const [entry] = await db.select().from(entries).where(eq(entries.id, entryId)).limit(1);
  if (!entry) return { error: "Streepje niet gevonden." };
  if (entry.periodId !== period.id) return { error: "Deze periode is al afgesloten." };
  if (entry.addedByAccountId !== session.accountId) {
    return { error: "Je kan enkel je eigen streepjes ongedaan maken." };
  }

  await db.delete(entries).where(eq(entries.id, entryId));
  revalidateAfterEntryChange(entry.personId);

  return { success: true };
}

/** Admin-only correction for mistakes noticed after the transient undo
 * window - restricted to the still-open period, same as undoEntry, so
 * settled/closed-period history stays immutable. */
export async function deleteEntry(
  entryId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await requireSession();
  const period = await getCurrentPeriod();

  const [entry] = await db.select().from(entries).where(eq(entries.id, entryId)).limit(1);
  if (!entry) return { error: "Streepje niet gevonden." };
  if (entry.periodId !== period.id) return { error: "Deze periode is al afgesloten." };

  const isOwner = entry.addedByAccountId === session.accountId;
  if (!isOwner && !session.isAdmin) return { error: "Geen toestemming." };

  await db.delete(entries).where(eq(entries.id, entryId));
  revalidateAfterEntryChange(entry.personId);

  return { success: true };
}
