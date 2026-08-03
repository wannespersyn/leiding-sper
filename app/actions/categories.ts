"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function updateCategoryPrice(
  categoryId: string,
  priceCents: number,
  externExtraCents: number,
): Promise<void> {
  await requireAdmin();

  if (
    !Number.isInteger(priceCents) ||
    !Number.isInteger(externExtraCents) ||
    priceCents < 0 ||
    externExtraCents < 0
  ) {
    throw new Error("Ongeldige prijs.");
  }

  await db
    .update(categories)
    .set({ priceCents, externExtraCents })
    .where(eq(categories.id, categoryId));

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/person/[id]", "page");
}
