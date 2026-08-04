"use server";

import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { categories, periodCategoryPrices, periods } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function closePeriod(newPeriodName: string): Promise<void> {
  await requireAdmin();

  const trimmed = newPeriodName.trim();
  if (!trimmed) throw new Error("Naam voor de nieuwe periode is verplicht.");

  const [current] = await db.select().from(periods).where(isNull(periods.closedAt)).limit(1);
  if (!current) throw new Error("Geen open periode gevonden.");

  const cats = await db.select().from(categories);

  await db.insert(periodCategoryPrices).values(
    cats.map((c) => ({
      periodId: current.id,
      categoryId: c.id,
      priceLeidingCents: c.priceLeidingCents,
      priceExternCents: c.priceExternCents,
    })),
  );

  await db.update(periods).set({ closedAt: new Date() }).where(eq(periods.id, current.id));
  await db.insert(periods).values({ name: trimmed });

  revalidatePath("/");
  revalidatePath("/overzicht");
  revalidatePath("/admin");
  revalidatePath("/person/[id]", "page");
}

export async function deletePeriod(periodId: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();

  const [period] = await db.select().from(periods).where(eq(periods.id, periodId)).limit(1);
  if (!period) return { error: "Periode niet gevonden." };
  if (!period.closedAt) return { error: "Je kan de actieve periode niet verwijderen." };

  await db.delete(periods).where(eq(periods.id, periodId));

  revalidatePath("/admin");
  revalidatePath("/person/[id]", "page");

  return { success: true };
}
