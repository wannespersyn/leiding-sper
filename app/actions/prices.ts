"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function updateCategoryPrice(
  categoryId: string,
  priceLeidingCents: number,
  priceExternCents: number,
): Promise<void> {
  await requireAdmin();

  if (
    !Number.isInteger(priceLeidingCents) ||
    !Number.isInteger(priceExternCents) ||
    priceLeidingCents < 0 ||
    priceExternCents < 0
  ) {
    throw new Error("Ongeldige prijs.");
  }

  await db
    .update(categories)
    .set({ priceLeidingCents, priceExternCents })
    .where(eq(categories.id, categoryId));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/person/[id]", "page");
}
