"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { categories, entries } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";

export async function addEntry(
  personId: string,
  categoryKey: "bier" | "sterke",
): Promise<{ entryId: string }> {
  const session = await requireSession();

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
      addedByAccountId: session.accountId,
    })
    .returning();

  revalidatePath("/");
  revalidatePath(`/person/${personId}`);

  return { entryId: entry.id };
}

export async function undoEntry(
  entryId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await requireSession();

  const [entry] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);

  if (!entry) return { error: "Streepje niet gevonden." };
  if (entry.addedByAccountId !== session.accountId) {
    return { error: "Je kan enkel je eigen streepjes ongedaan maken." };
  }
  if (entry.settlementId) return { error: "Al afgerekend." };

  await db.delete(entries).where(eq(entries.id, entryId));

  revalidatePath("/");
  revalidatePath(`/person/${entry.personId}`);

  return { success: true };
}
