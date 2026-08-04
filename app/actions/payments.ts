"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { payments, persons } from "@/db/schema";
import { requireAdmin, requireSession } from "@/lib/auth/session";

export async function markPaid(periodId: string): Promise<{ error: string } | { success: true }> {
  const session = await requireSession();

  const [person] = await db.select().from(persons).where(eq(persons.id, session.personId)).limit(1);
  if (!person || person.type === "scouts") return { error: "Niet van toepassing." };

  await db
    .insert(payments)
    .values({ personId: session.personId, periodId, markedPaidAt: new Date() })
    .onConflictDoUpdate({
      target: [payments.personId, payments.periodId],
      set: { markedPaidAt: new Date() },
    });

  revalidatePath(`/person/${session.personId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function unmarkPaid(periodId: string): Promise<{ error: string } | { success: true }> {
  const session = await requireSession();

  const [existing] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.personId, session.personId), eq(payments.periodId, periodId)))
    .limit(1);
  if (!existing) return { success: true };
  if (existing.confirmedAt) {
    return { error: "Al bevestigd door de admin - neem contact op om dit te corrigeren." };
  }

  await db.delete(payments).where(eq(payments.id, existing.id));

  revalidatePath(`/person/${session.personId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function confirmPaid(
  personId: string,
  periodId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await requireAdmin();

  const [existing] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.personId, personId), eq(payments.periodId, periodId)))
    .limit(1);
  if (!existing || !existing.markedPaidAt) {
    return { error: "Deze persoon heeft nog niet aangeduid dat betaald is." };
  }

  await db
    .update(payments)
    .set({ confirmedAt: new Date(), confirmedByAccountId: session.accountId })
    .where(eq(payments.id, existing.id));

  revalidatePath(`/person/${personId}`);
  revalidatePath("/admin");
  return { success: true };
}
