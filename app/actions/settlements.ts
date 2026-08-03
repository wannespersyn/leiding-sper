"use server";

import { isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { categories, entries, settlementPrices, settlements } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function createSettlement(): Promise<{ settlementId: string }> {
  const session = await requireAdmin();

  const cats = await db.select().from(categories);

  const [settlement] = await db
    .insert(settlements)
    .values({ createdByAccountId: session.accountId })
    .returning();

  await db.insert(settlementPrices).values(
    cats.map((c) => ({
      settlementId: settlement.id,
      categoryId: c.id,
      priceCents: c.priceCents,
      externExtraCents: c.externExtraCents,
    })),
  );

  await db
    .update(entries)
    .set({ settlementId: settlement.id })
    .where(isNull(entries.settlementId));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/person/[id]", "page");

  return { settlementId: settlement.id };
}
