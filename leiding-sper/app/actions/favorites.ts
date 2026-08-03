"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { favorites } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";

export async function toggleFavorite(personId: string): Promise<void> {
  const session = await requireSession();

  const existing = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.accountId, session.accountId),
        eq(favorites.personId, personId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
  } else {
    await db.insert(favorites).values({ accountId: session.accountId, personId });
  }

  revalidatePath("/");
  revalidatePath(`/person/${personId}`);
}
